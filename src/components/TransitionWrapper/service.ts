import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState, useRef, useTransition, useCallback } from "react";

/**
 * ページ遷移アニメーションを管理するカスタムフック
 *
 * ## 動作フロー
 *
 * 1. リンククリックのインターセプト
 *    - document.addEventListener('click', handler, true)でキャプチャフェーズでイベント処理
 *    - イベントの伝播順序：キャプチャ（親→子） → ターゲット → バブリング（子→親）
 *    - キャプチャフェーズを使用することで、他のイベントハンドラより先に処理を実行できる
 *    - これによりpreventDefault()でデフォルトのページ遷移を確実に防止する
 *    - 同一オリジンの異なるパスへのリンクのみを処理対象とする
 *
 * 2. 退出アニメーション（maskFadeOut）の実行
 *    - isTransitioning = trueでCSSクラス.transitioningを適用
 *    - clip-pathが左から右へ収縮するアニメーション（2秒）が開始
 *    - animationendイベントでanimationName === 'maskFadeOut'を確認
 *    - 確認後、startTransition内でrouter.push()を実行してページ遷移
 *
 * 3. 入場アニメーション（maskFadeIn）の実行
 *    - usePathnameでURLパス変更を検知（= ページ遷移完了）
 *    - isFirstMountフラグで初回レンダリング時のアニメーションを防止
 *    - isEntering = trueでCSSクラス.enteringを適用
 *    - clip-pathが右から左へ展開するアニメーション（2秒）が開始
 *    - animationendイベント完了後、すべての状態をリセット
 */

// アニメーション名の定数化
const ANIMATION_NAMES = {
  SLIDE_OUT: "maskFadeOut",
  SLIDE_IN: "maskFadeIn",
} as const;

// カスタムフックの戻り値の型定義
interface UsePageTransitionReturn {
  wrapperRef: React.RefObject<HTMLDivElement | null>;
  className: string;
}

export function usePageTransition(): UsePageTransitionReturn {
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [isEntering, setIsEntering] = useState(false);
  const pathname = usePathname();
  const router = useRouter();
  const wrapperRef = useRef<HTMLDivElement>(null);
  const pendingPathRef = useRef<string | null>(null);
  const [, startTransition] = useTransition();
  const isFirstMount = useRef(true);

  // パス変更を検知して入場アニメーションを開始
  useEffect(() => {
    if (!isFirstMount.current) {
      setIsEntering(true);
      setIsTransitioning(false);
    } else {
      isFirstMount.current = false;
    }
  }, [pathname]);

  // 同一オリジンチェックの共通化
  const isSameOriginLink = useCallback((href: string): boolean => {
    return href.startsWith(window.location.origin);
  }, []);

  // リンクがクリック可能かチェック
  const isNavigableLink = useCallback(
    (link: HTMLAnchorElement): boolean => {
      if (!link.href || !isSameOriginLink(link.href)) return false;

      const url = new URL(link.href);
      return url.pathname !== pathname;
    },
    [pathname, isSameOriginLink]
  );

  // グローバルクリックイベントを監視
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      const link = target.closest("a");

      if (link && isNavigableLink(link)) {
        e.preventDefault();
        e.stopPropagation();

        const url = new URL(link.href);
        pendingPathRef.current = url.pathname;
        setIsTransitioning(true);
      }
    };

    document.addEventListener("click", handleClick, true);
    return () => document.removeEventListener("click", handleClick, true);
  }, [isNavigableLink]);

  // アニメーション終了ハンドラの共通化
  const createAnimationEndHandler = useCallback((animationName: string, onComplete: () => void) => {
    return (e: AnimationEvent) => {
      if (e.animationName === animationName && e.target === e.currentTarget) {
        onComplete();
      }
    };
  }, []);

  // maskFadeOutアニメーション完了後にページ遷移を実行
  useEffect(() => {
    if (!isTransitioning || !wrapperRef.current || !pendingPathRef.current) return;

    const element = wrapperRef.current;
    const targetPath = pendingPathRef.current;

    const handleAnimationEnd = createAnimationEndHandler(ANIMATION_NAMES.SLIDE_OUT, () => {
      startTransition(() => {
        router.push(targetPath);
      });
    });

    element.addEventListener("animationend", handleAnimationEnd);
    return () => element.removeEventListener("animationend", handleAnimationEnd);
  }, [isTransitioning, router, createAnimationEndHandler]);

  // maskFadeInアニメーション完了後に状態をリセット
  useEffect(() => {
    if (!isEntering || !wrapperRef.current) return;

    const element = wrapperRef.current;
    const handleAnimationEnd = createAnimationEndHandler(ANIMATION_NAMES.SLIDE_IN, () => {
      setIsEntering(false);
      pendingPathRef.current = null;
    });

    element.addEventListener("animationend", handleAnimationEnd);
    return () => element.removeEventListener("animationend", handleAnimationEnd);
  }, [isEntering, createAnimationEndHandler]);

  const className = `transition-wrapper ${isTransitioning ? "transitioning" : ""} ${isEntering ? "entering" : ""}`;

  return {
    wrapperRef,
    className,
  };
}
