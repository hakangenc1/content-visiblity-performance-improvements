import { useState } from 'react';

const ItemList = ({ useContentVisibility }) => {
  const [items] = useState(() => 
    Array.from({ length: 1000 }, (_, i) => ({
      id: i,
      title: `Item ${i}`,
      description: `This is a detailed description for item ${i}. It contains enough text to make each item substantial in size.`,
      price: (Math.random() * 100).toFixed(2)
    }))
  );

  return (
    <div className="item-list">
      {items.map(item => (
        <div 
          key={item.id}
          className="item"
          style={useContentVisibility ? { contentVisibility: 'auto' } : {}}
        >
          <h3>{item.title}</h3>
          <p>{item.description}</p>
          <p>Price: ${item.price}</p>
        </div>
      ))}
    </div>
  );
};

export default ItemList;