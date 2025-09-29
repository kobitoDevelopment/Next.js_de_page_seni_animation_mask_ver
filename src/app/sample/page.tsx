import Link from 'next/link'

export default function SamplePage() {
  return (
    <main>
      <h1>Sample Page</h1>
      <Link href="/">
        トップページへ戻る
      </Link>
    </main>
  )
}