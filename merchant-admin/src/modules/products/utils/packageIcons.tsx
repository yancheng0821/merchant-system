import React from 'react';
import {
  CardGiftcard as PackageIcon,
  Redeem as RedeemIcon,
  Loyalty as LoyaltyIcon,
  LocalOffer as ServiceIcon,
  Sell as SellIcon,
  Favorite as FavoriteIcon,
  FavoriteBorder as FavoriteBorderIcon,
  VolunteerActivism as VolunteerActivismIcon,
  Spa as SpaIcon,
  SelfImprovement as SelfImprovementIcon,
  HotTub as HotTubIcon,
  Pool as PoolIcon,
  Diamond as DiamondIcon,
  Star as StarIcon,
  Stars as StarsIcon,
  AutoAwesome as AutoAwesomeIcon,
  WorkspacePremium as WorkspacePremiumIcon,
  Cake as CakeIcon,
  Celebration as CelebrationIcon,
  EmojiEvents as EmojiEventsIcon,
  MilitaryTech as MilitaryTechIcon,
  Weekend as WeekendIcon,
  Hotel as HotelIcon,
  BeachAccess as BeachAccessIcon,
  Cottage as CottageIcon,
  WineBar as WineBarIcon,
  Coffee as CoffeeIcon,
  Restaurant as RestaurantIcon,
  LocalCafe as LocalCafeIcon,
  LocalFlorist as LocalFloristIcon,
  Yard as YardIcon,
  Nature as NatureIcon,
  Park as ParkIcon,
  Healing as HealingIcon,
  HealthAndSafety as HealthAndSafetyIcon,
  MedicalServices as MedicalServicesIcon,
  Psychology as PsychologyIcon,
} from '@mui/icons-material';

// 获取图标组件的辅助函数
export const getPackageIconComponent = (iconValue: string) => {
  switch (iconValue) {
    case 'card_giftcard': return <PackageIcon />;
    case 'redeem': return <RedeemIcon />;
    case 'loyalty': return <LoyaltyIcon />;
    case 'local_offer': return <ServiceIcon />;
    case 'sell': return <SellIcon />;
    case 'favorite': return <FavoriteIcon />;
    case 'favorite_border': return <FavoriteBorderIcon />;
    case 'volunteer_activism': return <VolunteerActivismIcon />;
    case 'spa': return <SpaIcon />;
    case 'self_improvement': return <SelfImprovementIcon />;
    case 'hot_tub': return <HotTubIcon />;
    case 'pool': return <PoolIcon />;
    case 'diamond': return <DiamondIcon />;
    case 'star': return <StarIcon />;
    case 'stars': return <StarsIcon />;
    case 'auto_awesome': return <AutoAwesomeIcon />;
    case 'workspace_premium': return <WorkspacePremiumIcon />;
    case 'cake': return <CakeIcon />;
    case 'celebration': return <CelebrationIcon />;
    case 'emoji_events': return <EmojiEventsIcon />;
    case 'military_tech': return <MilitaryTechIcon />;
    case 'weekend': return <WeekendIcon />;
    case 'hotel': return <HotelIcon />;
    case 'beach_access': return <BeachAccessIcon />;
    case 'cottage': return <CottageIcon />;
    case 'wine_bar': return <WineBarIcon />;
    case 'coffee': return <CoffeeIcon />;
    case 'restaurant': return <RestaurantIcon />;
    case 'local_cafe': return <LocalCafeIcon />;
    case 'local_florist': return <LocalFloristIcon />;
    case 'yard': return <YardIcon />;
    case 'nature': return <NatureIcon />;
    case 'park': return <ParkIcon />;
    case 'healing': return <HealingIcon />;
    case 'health_and_safety': return <HealthAndSafetyIcon />;
    case 'medical_services': return <MedicalServicesIcon />;
    case 'psychology': return <PsychologyIcon />;
    default: return <PackageIcon />;
  }
};
