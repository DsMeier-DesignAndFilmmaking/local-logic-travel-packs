'use client';

interface PremiumUnlockProps {
  tier: 'tier2' | 'tier3';
  city: string;
}

export default function PremiumUnlock({ tier, city }: PremiumUnlockProps) {
  const isTier2 = tier === 'tier2';
  const tierName = isTier2 ? 'Gold Premium' : 'Platinum';
  const tierColor = isTier2 ? '#F59E0B' : '#8B5CF6';
  const tierBg = isTier2 ? '#FEF3C7' : '#F3E8FF';

  return (
    <div 
      className="mt-4 p-4 rounded-lg border-2 border-dashed text-center"
      style={{ 
        backgroundColor: tierBg,
        borderColor: tierColor 
      }}
    >
      <div className="flex items-center justify-center gap-2 mb-2">
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{ color: tierColor }}>
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
        </svg>
        <h4 className="font-semibold" style={{ color: tierColor }}>
          {tierName} Content
        </h4>
      </div>
      <p className="text-sm mb-3" style={{ color: '#1A1A1A' }}>
        {isTier2 
          ? 'Unlock premium experiences and exclusive recommendations for this city.'
          : 'Access AI-generated personalized itineraries and exclusive experiences.'}
      </p>
      <button
        className="px-6 py-2 rounded-lg font-medium transition-colors"
        style={{ 
          backgroundColor: tierColor,
          color: '#FFFFFF',
          minHeight: '44px' // Touch-friendly
        }}
        onClick={() => {
          // Placeholder for future premium unlock
          alert(`${tierName} premium features coming soon!`);
        }}
      >
        Unlock {tierName}
      </button>
    </div>
  );
}
