/**
 * @fileoverview Utility functions for room images
 * @module utils/roomImages
 */

/**
 * Get room image URL based on room type and code
 * Uses Unsplash for high-quality placeholder images
 * @param {Object} room - Room object
 * @param {string} room.type - Room type (single, double, suite)
 * @param {string} room.code - Room code
 * @param {string} room.image - Custom image URL (if provided)
 * @returns {string} Image URL
 */
export const getRoomImage = (room) => {
  // If room has a custom image, use it
  if (room.image) {
    return room.image;
  }

  // If room has images array, use first image
  if (room.images && room.images.length > 0) {
    return room.images[0];
  }

  // Default images based on room type
  // Using Unsplash with deterministic selection for consistency
  // In production, replace with local static assets in public/ folder
  const roomType = room.type?.toLowerCase() || 'single';
  const roomCode = room.code || '101';
  
  // Hotel room images from Unsplash (royalty-free, high quality)
  // For production: Replace with local images in public/images/rooms/
  const imageMap = {
    single: {
      default: 'https://images.unsplash.com/photo-1631049307264-da0ec9d70304?w=800&h=600&fit=crop&q=80',
      variants: [
        'https://images.unsplash.com/photo-1631049307264-da0ec9d70304?w=800&h=600&fit=crop&q=80',
        'https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?w=800&h=600&fit=crop&q=80',
        'https://images.unsplash.com/photo-1522771739844-6a9f6d5f14af?w=800&h=600&fit=crop&q=80',
      ],
    },
    double: {
      default: 'https://images.unsplash.com/photo-1611892440504-42a792e24d32?w=800&h=600&fit=crop&q=80',
      variants: [
        'https://images.unsplash.com/photo-1611892440504-42a792e24d32?w=800&h=600&fit=crop&q=80',
        'https://images.unsplash.com/photo-1590490360182-c33d57733427?w=800&h=600&fit=crop&q=80',
        'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=800&h=600&fit=crop&q=80',
      ],
    },
    suite: {
      default: 'https://images.unsplash.com/photo-1596394516093-501ba68a0ba6?w=800&h=600&fit=crop&q=80',
      variants: [
        'https://images.unsplash.com/photo-1596394516093-501ba68a0ba6?w=800&h=600&fit=crop&q=80',
        'https://images.unsplash.com/photo-1618773928121-c32242e63f39?w=800&h=600&fit=crop&q=80',
        'https://images.unsplash.com/photo-1582268611958-ebfd161ef9cf?w=800&h=600&fit=crop&q=80',
      ],
    },
  };

  const typeImages = imageMap[roomType] || imageMap.single;
  
  // Use room code to deterministically select an image variant
  // This ensures the same room always shows the same image
  const codeNum = parseInt(roomCode.replace(/\D/g, '')) || 0;
  const variantIndex = codeNum % typeImages.variants.length;
  
  return typeImages.variants[variantIndex] || typeImages.default;
};

/**
 * Get room description based on type
 * @param {string} type - Room type
 * @returns {string} Description
 */
export const getRoomDescription = (type) => {
  const descriptions = {
    single: 'Cozy and comfortable single room perfect for solo travelers. Features modern amenities and a peaceful atmosphere.',
    double: 'Spacious double room ideal for couples or small families. Includes premium amenities and elegant furnishings.',
    suite: 'Luxurious suite with premium features and extra space. Perfect for an indulgent stay with top-tier amenities.',
  };
  
  return descriptions[type?.toLowerCase()] || descriptions.single;
};

