import React from 'react';
import { Link } from 'react-router-dom';
import './Pricing.css'; 
import Header from './header';

const PricingTier = ({ tier, description, price }) => {
  return (
    <div className="pricing-tier">
      <div className="tier-header">{tier}</div>
      <p className="tier-description">{description}</p>
      <p className="tier-price">${price} per month</p>
      <Link to={`/Creditcart/${tier}`} className="tier-button">
        Buy
      </Link>
    </div>
  );
};

const PricingComponent = () => {
  const tiers = [
    {
      name: 'basic',
      price: 5,
    },
    {
      name: 'pro',
      price: 10,
    },
    {
      name: 'premium',
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
            tier={tier.name}
            description={tier.description}
            price={tier.price}
          />
        ))}
      </div>
    </>
  );
};

export default PricingComponent;
