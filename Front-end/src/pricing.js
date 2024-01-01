import React from 'react';
import { Link } from 'react-router-dom';
import './Pricing.css'; 
import Header from './header';

const PricingTier = ({ tierName, description, price }) => {
  return (
    <div className="pricing-tier">
      <div className="tier-header">{tierName}</div>
      <p className="tier-description">{description}</p>
      <p className="tier-price">${price} per month</p>
      <Link to={`/Creditcart/${tierName}`} className="tier-button">
        Buy
      </Link>
    </div>
  );
};

const PricingComponent = () => {
  const tiers = [
    {
      name: 'basic',
      description: 'Describe your basic service here. What makes it great? Use short catchy text to tell people what you offer, and the benefits they will receive.',
      price: 5,
    },
    {
      name: 'pro',
      description: 'Describe your pro service here. What makes it great? Use short catchy text to tell people what you offer, and the benefits they will receive.',
      price: 10,
    },
    {
      name: 'premium',
      description: 'Describe your premium service here. What makes it great? Use short catchy text to tell people what you offer, and the benefits they will receive.',
      price: 15,
    },
  ];

  return (
    <>
      <Header />
      <div className="pricing-component">
        {tiers.map((tier, index) => (
          <PricingTier
            key={index}
            tierName={tier.name}
            description={tier.description}
            price={tier.price}
          />
        ))}
      </div>
    </>
  );
};

export default PricingComponent;
