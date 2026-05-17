function Navbar() {

  return (

    <nav className="bg-grey-100 text-black px-8 py-4 flex items-center justify-between">

      <h1 className="text-3xl font-bold">
        Travel Buddy
      </h1>

      <div className="flex gap-6">

        <a href="/" className="hover:text-gray-400">
          Home
        </a>

        <a href="/trips" className="hover:text-gray-400">
          Trips
        </a>

        <a href="/login" className="hover:text-gray-400">
          Login
        </a>

      </div>

    </nav>

  )
}

export default Navbar