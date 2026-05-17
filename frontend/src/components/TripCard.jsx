function TripCard({ title, location, budget }) {

  return (

    <div className="bg-white p-6 rounded-xl shadow-md">

      <h1 className="text-2xl font-bold">
        {title}
      </h1>

      <p className="text-gray-600 mt-2">
        📍 {location}
      </p>

      <p className="text-green-600 font-semibold mt-2">
        ₹ {budget}
      </p>

    </div>

  )
}

export default TripCard