import { OfflineTravelPack } from '@/types';

interface PackCardProps {
  pack: OfflineTravelPack;
}

export default function PackCard({ pack }: PackCardProps) {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm">
      {/* Header Section */}
      <div className="border-b border-gray-200 dark:border-gray-700 px-6 py-5">
        <div className="flex justify-between items-start mb-3">
          <h2 className="text-3xl font-bold text-gray-900 dark:text-white">
            {pack.city}
          </h2>
          <span className="text-sm font-medium text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded">
            v{pack.version}
          </span>
        </div>
        {pack.context && (
          <p className="text-base text-gray-600 dark:text-gray-300 leading-relaxed mb-2">
            {pack.context}
          </p>
        )}
        {pack.lastUpdated && (
          <p className="text-xs text-gray-500 dark:text-gray-400">
            Last updated: {new Date(pack.lastUpdated).toLocaleDateString('en-US', { 
              year: 'numeric', 
              month: 'long', 
              day: 'numeric' 
            })}
          </p>
        )}
      </div>

      {/* Content Sections */}
      <div className="px-6 py-6 space-y-8">
        {/* Must Know First */}
        {pack.mustKnowFirst && pack.mustKnowFirst.length > 0 && (
          <section>
            <div className="mb-4">
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-1">
                Must Know First
              </h3>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Essential information to read before you go
              </p>
            </div>
            <ul className="space-y-3">
              {pack.mustKnowFirst.map((item, index) => (
                <li key={index} className="text-gray-700 dark:text-gray-300 leading-relaxed flex items-start">
                  <span className="text-blue-600 dark:text-blue-400 mr-3 mt-1 font-bold flex-shrink-0">•</span>
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </section>
        )}

        {/* Neighborhoods */}
        {pack.neighborhoods && pack.neighborhoods.length > 0 && (
          <section>
            <div className="mb-4">
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-1">
                Neighborhoods
              </h3>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Where to go and why it matters
              </p>
            </div>
            <div className="space-y-5">
              {pack.neighborhoods.map((neighborhood, index) => (
                <div key={index} className="border-l-4 border-blue-500 pl-4 py-2">
                  <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                    {neighborhood.name}
                  </h4>
                  <p className="text-gray-700 dark:text-gray-300 leading-relaxed mb-3">
                    {neighborhood.whyItMatters}
                  </p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    <span className="font-medium">Best for:</span> {neighborhood.bestFor}
                  </p>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Eat Like a Local */}
        {pack.eatLikeALocal && pack.eatLikeALocal.length > 0 && (
          <section>
            <div className="mb-4">
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-1">
                Eat Like a Local
              </h3>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Dining customs and insider tips
              </p>
            </div>
            <ul className="space-y-2.5">
              {pack.eatLikeALocal.map((item, index) => (
                <li key={index} className="text-gray-700 dark:text-gray-300 leading-relaxed flex items-start">
                  <span className="text-blue-600 dark:text-blue-400 mr-3 mt-1 font-bold flex-shrink-0">•</span>
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </section>
        )}

        {/* Avoid These Mistakes */}
        {pack.avoidTheseMistakes && pack.avoidTheseMistakes.length > 0 && (
          <section>
            <div className="mb-4">
              <h3 className="text-xl font-semibold text-red-600 dark:text-red-400 mb-1">
                Avoid These Mistakes
              </h3>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Common pitfalls to steer clear of
              </p>
            </div>
            <ul className="space-y-2.5">
              {pack.avoidTheseMistakes.map((item, index) => (
                <li key={index} className="text-gray-700 dark:text-gray-300 leading-relaxed flex items-start">
                  <span className="text-red-600 dark:text-red-400 mr-3 mt-1 font-bold flex-shrink-0">✗</span>
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </section>
        )}

        {/* Offline Tips */}
        {pack.offlineTips && pack.offlineTips.length > 0 && (
          <section>
            <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-5 border border-blue-200 dark:border-blue-800">
              <div className="mb-4">
                <h3 className="text-xl font-semibold text-blue-900 dark:text-blue-200 mb-1">
                  Offline Tips
                </h3>
                <p className="text-sm text-blue-700 dark:text-blue-300">
                  Prepare your device for offline use
                </p>
              </div>
              <ul className="space-y-2.5">
                {pack.offlineTips.map((tip, index) => (
                  <li key={index} className="text-gray-700 dark:text-gray-300 leading-relaxed flex items-start">
                    <span className="text-blue-600 dark:text-blue-400 mr-3 mt-1 font-bold flex-shrink-0">📱</span>
                    <span>{tip}</span>
                  </li>
                ))}
              </ul>
            </div>
          </section>
        )}
      </div>
    </div>
  );
}
