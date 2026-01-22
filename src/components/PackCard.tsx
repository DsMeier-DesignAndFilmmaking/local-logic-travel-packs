import { SimplePack } from '@/types';

interface PackCardProps {
  pack: SimplePack;
}

export default function PackCard({ pack }: PackCardProps) {
  return (
    <div className="border border-gray-200 rounded-lg p-6 shadow-sm hover:shadow-md transition-shadow dark:border-gray-700 dark:bg-gray-800">
      <h3 className="text-2xl font-semibold text-gray-900 dark:text-white mb-6">
        {pack.city}
      </h3>
      
      {pack.activities && pack.activities.length > 0 && (
        <div className="mb-6">
          <h4 className="text-lg font-medium text-gray-800 dark:text-gray-200 mb-3">
            Activities
          </h4>
          <ul className="list-disc list-inside space-y-2 text-gray-700 dark:text-gray-300">
            {pack.activities.map((activity, index) => (
              <li key={index}>{activity}</li>
            ))}
          </ul>
        </div>
      )}
      
      {pack.restaurants && pack.restaurants.length > 0 && (
        <div className="mb-6">
          <h4 className="text-lg font-medium text-gray-800 dark:text-gray-200 mb-3">
            Restaurants
          </h4>
          <ul className="list-disc list-inside space-y-2 text-gray-700 dark:text-gray-300">
            {pack.restaurants.map((restaurant, index) => (
              <li key={index}>{restaurant}</li>
            ))}
          </ul>
        </div>
      )}
      
      {pack.tips && pack.tips.length > 0 && (
        <div>
          <h4 className="text-lg font-medium text-gray-800 dark:text-gray-200 mb-3">
            Tips
          </h4>
          <ul className="list-disc list-inside space-y-2 text-gray-700 dark:text-gray-300">
            {pack.tips.map((tip, index) => (
              <li key={index}>{tip}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
