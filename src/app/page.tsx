import Link from 'next/link'

export default function Home() {
  return (
    <main>
      <h1>Top Page</h1>
      <Link href="/sample">
        サンプルページへ
      </Link>
    </main>
  )
}