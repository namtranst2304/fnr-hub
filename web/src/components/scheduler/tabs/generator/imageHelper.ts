export const CYBER_IMAGES = {
  code: 'https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?w=800&auto=format&fit=crop&q=80',
  ai: 'https://images.unsplash.com/photo-1535378917042-10a22c95931a?w=800&auto=format&fit=crop&q=80',
  city: 'https://images.unsplash.com/photo-1508739773434-c26b3d09e071?w=800&auto=format&fit=crop&q=80',
  robot: 'https://images.unsplash.com/photo-1485827404703-89b55fcc595e?w=800&auto=format&fit=crop&q=80',
  cyber: 'https://images.unsplash.com/photo-1509198397868-475647b2a1e5?w=800&auto=format&fit=crop&q=80'
};

export function getCyberImageForText(text: string): string {
  const lowercase = text.toLowerCase();

  if (lowercase.includes('code') || lowercase.includes('hack') || lowercase.includes('programming') || lowercase.includes('database')) {
    return CYBER_IMAGES.code;
  }
  if (lowercase.includes('ai') || lowercase.includes('intelligence') || lowercase.includes('model') || lowercase.includes('chatgpt')) {
    return CYBER_IMAGES.ai;
  }
  if (lowercase.includes('robot') || lowercase.includes('phone') || lowercase.includes('device') || lowercase.includes('headphone') || lowercase.includes('airpod')) {
    return CYBER_IMAGES.robot;
  }
  if (lowercase.includes('city') || lowercase.includes('street') || lowercase.includes('tokyo') || lowercase.includes('neon') || lowercase.includes('funny') || lowercase.includes('car')) {
    return CYBER_IMAGES.city;
  }
  return CYBER_IMAGES.cyber;
}
