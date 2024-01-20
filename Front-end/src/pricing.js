import React from 'react';
import { Link } from 'react-router-dom';
import './Pricing.css'; 
import Header from './header';
import Footer from './Footer';
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
      size: '250 MB',
      price: 5,
    },
    {
      name: 'pro',
      size: '500 MB',
      price: 10,
    },
    {
      name: 'premium',
      size: '1000 MB',
      price: 15,
    },
  ];

  return (
    <>
      <Header />
      <div className='pricing-component1'>
      <div className="pricing-component">
        {tiers.map((tier, index) => (
          <PricingTier
            key={index}
            tier={tier.name}
            description={tier.size}
            price={tier.price}
          />
        ))}
        </div>

      </div>
      <Footer />
    </>
  );
};

export default PricingComponent;
