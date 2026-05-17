import { useState } from "react"
import TripCard from "../components/TripCard"

function TripsPage() {

   const [trips, setTrips] = useState([])
   async function fetchTrips() {
    const response=await fetch("http://localhost:5000/api/trips")
      const data = await response.json()
          setTrips(data)
   }

    useEffect(() => {

    fetchTrips()

  }, [])


  return (

    <div className="p-8 grid grid-cols-3 gap-6">

      {
        trips.map((trip) => (

          <TripCard
            key={trip.id}
            title={trip.title}
            location={trip.location}
            budget={trip.budget}
          />

        ))
      }

    </div>

  )
}

export default TripsPage