import { Angry, Smile, } from 'lucide-react'
import React from 'react'

const Mood = () => {
  return (
    <div className='lg:w-3/4 border aspect-square flex flex-col justify-center items-center rounded-3xl'>
        <div className='flex gap-3'>
            <Smile />
            <Angry />
        </div>
        <div>
           <h1>
           How are you feeling today?
           </h1>
        </div>
    </div>
  )
}

export default Mood
