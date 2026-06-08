import React from 'react'
import { Book, FlameIcon } from "lucide-react";


const Journey = () => {
    return (
        <div className='w-full bg-grey-400 rounded-lg px-8 py-8 border items-center flex gap-8 justify-between'>
            <div className='proress-bar w-2/3 '>
                <div className='title w-full flex justify-between'>
                    <h1>
                        Weekly Goal
                    </h1>

                    <h1>
                        4/5
                    </h1>
                </div>
                <div className='bar w-full h-2 bg-gray-200 rounded-full'>
                    <div className='bar-fill h-full bg-blue-500 rounded-full' style={{ width: '80%' }}></div>
                </div>
                <div>
                    <h1>
                        You are doing good log in on one mor day to continue your streak
                    </h1>
                </div>
            </div>

            <div className='seperator w-1.5 rounded-full h-24 bg-blue-600'>
            </div>

            <div className='streaks journal flex gap-4 '>

                <div className="w-56 rounded-xl flex flex-col gap-y-2 px-6 py-3 border ">
                    <div className='flex gap-2 text-md items-center text-orange-600'>
                        <FlameIcon />
                        <h1>
                            Streaks
                        </h1>
                    </div>
                    <h1 className='font-bold text-4xl'>
                        12 days
                    </h1>

                </div>

                <div className="w-56 rounded-xl flex flex-col gap-y-2 px-6 py-3 border ">
                    <div className='flex gap-2 text-md items-center text-blue-600'>
                        <Book />
                        <h1>
                            Journal
                        </h1>
                    </div>
                    <h1 className='font-bold text-4xl'>
                        8 entris
                    </h1>

                </div>

            </div>

        </div>
    )
}

export default Journey