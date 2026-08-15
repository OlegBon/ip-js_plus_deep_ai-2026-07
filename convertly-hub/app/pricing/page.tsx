import { CheckIcon } from '@heroicons/react/24/outline';

const tiers = [
  {
    name: 'Free',
    id: 'tier-free',
    href: '#',
    priceMonthly: '$0',
    description: 'Basic access for individuals. No API, no registration.',
    features: [
      '1 project',
      'Up to 100 tasks',
      '250MB of storage',
      'Community support',
    ],
    mostPopular: false,
  },
  {
    name: 'Basic',
    id: 'tier-basic',
    href: '#',
    priceMonthly: '$9',
    description: 'Get started with our basic features.',
    features: [
      '5 projects',
      'Up to 1,000 tasks',
      '2GB of storage',
      'Email support',
    ],
    mostPopular: false,
  },
  {
    name: 'Pro',
    id: 'tier-pro',
    href: '#',
    priceMonthly: '$19',
    description: 'More power for small teams.',
    features: [
      '50 projects',
      'Up to 10,000 tasks',
      '100GB of storage',
      'Priority email support',
      'Advanced analytics',
    ],
    mostPopular: true,
  },
  {
    name: 'Enterprise',
    id: 'tier-enterprise',
    href: '#',
    priceMonthly: '$49',
    description: 'For large organizations.',
    features: [
      'Unlimited projects',
      'Unlimited tasks',
      '1TB of storage',
      '24/7 phone and email support',
      'Dedicated account manager',
    ],
    mostPopular: false,
  },
];

function classNames(...classes: string[]) {
  return classes.filter(Boolean).join(' ');
}

export default function PricingPage() {
  return (
    <div className="bg-white py-24 sm:py-32">
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        <div className="mx-auto max-w-2xl sm:text-center">
          <h2 className="text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
            Simple, Transparent Pricing
          </h2>
          <p className="mt-6 text-lg leading-8 text-gray-600">
            Choose the plan that’s right for you.
          </p>
        </div>
        <div className="mx-auto mt-16 grid max-w-lg grid-cols-1 items-center gap-y-6 sm:mt-20 sm:gap-y-0 lg:max-w-none lg:grid-cols-4 lg:gap-x-4">
          {tiers.map((tier) => (
            <div
              key={tier.id}
              className={classNames(
                tier.mostPopular ? 'relative bg-white shadow-2xl' : 'bg-white',
                'rounded-3xl p-8 ring-1 ring-gray-200 sm:p-10'
              )}
            >
              <h3 id={tier.id} className="text-base font-semibold leading-7 text-gray-900">
                {tier.name}
              </h3>
              <p className="mt-4 flex items-baseline gap-x-2">
                <span className="text-5xl font-bold tracking-tight text-gray-900">{tier.priceMonthly}</span>
                <span className="text-base text-gray-500">/month</span>
              </p>
              <p className="mt-6 text-base leading-7 text-gray-600">{tier.description}</p>
              <ul role="list" className="mt-8 space-y-3 text-sm leading-6 text-gray-600">
                {tier.features.map((feature) => (
                  <li key={feature} className="flex gap-x-3">
                    <CheckIcon className="h-6 w-5 flex-none text-gray-900" aria-hidden="true" />
                    {feature}
                  </li>
                ))}
              </ul>
              <a
                href={tier.href}
                aria-describedby={tier.id}
                className={classNames(
                  tier.mostPopular
                    ? 'bg-gray-800 text-white shadow-sm hover:bg-gray-900 focus-visible:outline-gray-900'
                    : 'text-gray-700 bg-white border border-gray-300 shadow-sm hover:bg-gray-50 focus-visible:outline-indigo-500',
                  'mt-8 block rounded-md py-2.5 px-3.5 text-center text-sm font-semibold focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 sm:mt-10'
                )}
              >
                Get started
              </a>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
