import React from 'react'
interface CardProps {
    title: string;
    description: string;
    icon: React.ReactNode;
    calltoaction: string;
    onClick: () => void;
}
const card = ({ title, description, icon, calltoaction, onClick }: CardProps) => {
  return (
    <div className="w-full bg-white rounded-lg shadow-md p-6">
        <div className="flex flex-col items-center justify-between">
            <div className="flex flex-col items-center gap-4">
                {icon}
                <h3 className="text-lg font-bold">{title}</h3>
            </div>
        </div>
        <p className="text-sm text-gray-500">{description}</p>
        <button className="mt-6 bg-blue-500 text-white px-4 py-2 rounded-md" onClick={onClick}>{calltoaction}</button>
    </div>
  )
}

export default card