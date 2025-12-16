import Link from 'next/link'

export default function NotFound() {
  return (
    <div className="h-screen w-full flex flex-col items-center justify-center bg-[#F6F3E8] text-[#231F20] p-4 text-center">
      <h2 className="font-playfair text-9xl md:text-[12rem] leading-none opacity-10">404</h2>
      <div className="absolute flex flex-col items-center gap-8">
        <h1 className="font-playfair text-4xl md:text-6xl">Lost in the Abstract</h1>
        <p className="font-instrument-sans text-sm md:text-base tracking-wide opacity-60 max-w-md">
          The page you are looking for has drifted away into the void.
        </p>
        <Link
          href="/"
          className="px-8 py-3 border border-[#231F20] text-sm uppercase tracking-widest hover:bg-[#231F20] hover:text-[#F6F3E8] transition-colors duration-300"
        >
          Return Home
        </Link>
      </div>
    </div>
  )
}
