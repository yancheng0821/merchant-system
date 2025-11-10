import React from 'react';
import {
  Box,
  TextField,
  MenuItem,
} from '@mui/material';
import { useTranslation } from 'react-i18next';

interface CountryCode {
  code: string;
  name: string;
  nameZh?: string;
  dialCode: string;
  flag: string;
}

const countryCodes: CountryCode[] = [
  { code: 'CA', name: 'Canada', nameZh: '加拿大', dialCode: '+1-CA', flag: '🇨🇦' },
  { code: 'US', name: 'United States', nameZh: '美国', dialCode: '+1-US', flag: '🇺🇸' },
  { code: 'CN', name: 'China', nameZh: '中国', dialCode: '+86', flag: '🇨🇳' },
  { code: 'GB', name: 'United Kingdom', nameZh: '英国', dialCode: '+44', flag: '🇬🇧' },
  { code: 'AU', name: 'Australia', nameZh: '澳大利亚', dialCode: '+61', flag: '🇦🇺' },
  { code: 'JP', name: 'Japan', nameZh: '日本', dialCode: '+81', flag: '🇯🇵' },
  { code: 'KR', name: 'South Korea', nameZh: '韩国', dialCode: '+82', flag: '🇰🇷' },
  { code: 'DE', name: 'Germany', nameZh: '德国', dialCode: '+49', flag: '🇩🇪' },
  { code: 'FR', name: 'France', nameZh: '法国', dialCode: '+33', flag: '🇫🇷' },
  { code: 'IT', name: 'Italy', nameZh: '意大利', dialCode: '+39', flag: '🇮🇹' },
  { code: 'ES', name: 'Spain', nameZh: '西班牙', dialCode: '+34', flag: '🇪🇸' },
  { code: 'NL', name: 'Netherlands', nameZh: '荷兰', dialCode: '+31', flag: '🇳🇱' },
  { code: 'SE', name: 'Sweden', nameZh: '瑞典', dialCode: '+46', flag: '🇸🇪' },
  { code: 'NO', name: 'Norway', nameZh: '挪威', dialCode: '+47', flag: '🇳🇴' },
  { code: 'DK', name: 'Denmark', nameZh: '丹麦', dialCode: '+45', flag: '🇩🇰' },
  { code: 'FI', name: 'Finland', nameZh: '芬兰', dialCode: '+358', flag: '🇫🇮' },
  { code: 'CH', name: 'Switzerland', nameZh: '瑞士', dialCode: '+41', flag: '🇨🇭' },
  { code: 'AT', name: 'Austria', nameZh: '奥地利', dialCode: '+43', flag: '🇦🇹' },
  { code: 'BE', name: 'Belgium', nameZh: '比利时', dialCode: '+32', flag: '🇧🇪' },
  { code: 'IE', name: 'Ireland', nameZh: '爱尔兰', dialCode: '+353', flag: '🇮🇪' },
  { code: 'PT', name: 'Portugal', nameZh: '葡萄牙', dialCode: '+351', flag: '🇵🇹' },
  { code: 'GR', name: 'Greece', nameZh: '希腊', dialCode: '+30', flag: '🇬🇷' },
  { code: 'PL', name: 'Poland', nameZh: '波兰', dialCode: '+48', flag: '🇵🇱' },
  { code: 'CZ', name: 'Czech Republic', nameZh: '捷克', dialCode: '+420', flag: '🇨🇿' },
  { code: 'HU', name: 'Hungary', nameZh: '匈牙利', dialCode: '+36', flag: '🇭🇺' },
  { code: 'RO', name: 'Romania', nameZh: '罗马尼亚', dialCode: '+40', flag: '🇷🇴' },
  { code: 'BG', name: 'Bulgaria', nameZh: '保加利亚', dialCode: '+359', flag: '🇧🇬' },
  { code: 'HR', name: 'Croatia', nameZh: '克罗地亚', dialCode: '+385', flag: '🇭🇷' },
  { code: 'SI', name: 'Slovenia', nameZh: '斯洛文尼亚', dialCode: '+386', flag: '🇸🇮' },
  { code: 'SK', name: 'Slovakia', nameZh: '斯洛伐克', dialCode: '+421', flag: '🇸🇰' },
  { code: 'LT', name: 'Lithuania', nameZh: '立陶宛', dialCode: '+370', flag: '🇱🇹' },
  { code: 'LV', name: 'Latvia', nameZh: '拉脱维亚', dialCode: '+371', flag: '🇱🇻' },
  { code: 'EE', name: 'Estonia', nameZh: '爱沙尼亚', dialCode: '+372', flag: '🇪🇪' },
  { code: 'RU', name: 'Russia', nameZh: '俄罗斯', dialCode: '+7', flag: '🇷🇺' },
  { code: 'UA', name: 'Ukraine', nameZh: '乌克兰', dialCode: '+380', flag: '🇺🇦' },
  { code: 'BY', name: 'Belarus', nameZh: '白俄罗斯', dialCode: '+375', flag: '🇧🇾' },
  { code: 'MD', name: 'Moldova', nameZh: '摩尔多瓦', dialCode: '+373', flag: '🇲🇩' },
  { code: 'IN', name: 'India', nameZh: '印度', dialCode: '+91', flag: '🇮🇳' },
  { code: 'PK', name: 'Pakistan', nameZh: '巴基斯坦', dialCode: '+92', flag: '🇵🇰' },
  { code: 'BD', name: 'Bangladesh', nameZh: '孟加拉国', dialCode: '+880', flag: '🇧🇩' },
  { code: 'LK', name: 'Sri Lanka', nameZh: '斯里兰卡', dialCode: '+94', flag: '🇱🇰' },
  { code: 'NP', name: 'Nepal', nameZh: '尼泊尔', dialCode: '+977', flag: '🇳🇵' },
  { code: 'MM', name: 'Myanmar', nameZh: '缅甸', dialCode: '+95', flag: '🇲🇲' },
  { code: 'TH', name: 'Thailand', nameZh: '泰国', dialCode: '+66', flag: '🇹🇭' },
  { code: 'VN', name: 'Vietnam', nameZh: '越南', dialCode: '+84', flag: '🇻🇳' },
  { code: 'KH', name: 'Cambodia', nameZh: '柬埔寨', dialCode: '+855', flag: '🇰🇭' },
  { code: 'LA', name: 'Laos', nameZh: '老挝', dialCode: '+856', flag: '🇱🇦' },
  { code: 'MY', name: 'Malaysia', nameZh: '马来西亚', dialCode: '+60', flag: '🇲🇾' },
  { code: 'SG', name: 'Singapore', nameZh: '新加坡', dialCode: '+65', flag: '🇸🇬' },
  { code: 'ID', name: 'Indonesia', nameZh: '印度尼西亚', dialCode: '+62', flag: '🇮🇩' },
  { code: 'PH', name: 'Philippines', nameZh: '菲律宾', dialCode: '+63', flag: '🇵🇭' },
  { code: 'BN', name: 'Brunei', nameZh: '文莱', dialCode: '+673', flag: '🇧🇳' },
  { code: 'TW', name: 'Taiwan', nameZh: '台湾', dialCode: '+886', flag: '🇹🇼' },
  { code: 'HK', name: 'Hong Kong', nameZh: '香港', dialCode: '+852', flag: '🇭🇰' },
  { code: 'MO', name: 'Macau', nameZh: '澳门', dialCode: '+853', flag: '🇲🇴' },
  { code: 'MN', name: 'Mongolia', nameZh: '蒙古', dialCode: '+976', flag: '🇲🇳' },
  { code: 'KZ', name: 'Kazakhstan', nameZh: '哈萨克斯坦', dialCode: '+7', flag: '🇰🇿' },
  { code: 'KG', name: 'Kyrgyzstan', nameZh: '吉尔吉斯斯坦', dialCode: '+996', flag: '🇰🇬' },
  { code: 'TJ', name: 'Tajikistan', nameZh: '塔吉克斯坦', dialCode: '+992', flag: '🇹🇯' },
  { code: 'TM', name: 'Turkmenistan', nameZh: '土库曼斯坦', dialCode: '+993', flag: '🇹🇲' },
  { code: 'UZ', name: 'Uzbekistan', nameZh: '乌兹别克斯坦', dialCode: '+998', flag: '🇺🇿' },
  { code: 'AF', name: 'Afghanistan', nameZh: '阿富汗', dialCode: '+93', flag: '🇦🇫' },
  { code: 'IR', name: 'Iran', nameZh: '伊朗', dialCode: '+98', flag: '🇮🇷' },
  { code: 'IQ', name: 'Iraq', nameZh: '伊拉克', dialCode: '+964', flag: '🇮🇶' },
  { code: 'SA', name: 'Saudi Arabia', nameZh: '沙特阿拉伯', dialCode: '+966', flag: '🇸🇦' },
  { code: 'AE', name: 'United Arab Emirates', nameZh: '阿联酋', dialCode: '+971', flag: '🇦🇪' },
  { code: 'QA', name: 'Qatar', nameZh: '卡塔尔', dialCode: '+974', flag: '🇶🇦' },
  { code: 'KW', name: 'Kuwait', nameZh: '科威特', dialCode: '+965', flag: '🇰🇼' },
  { code: 'BH', name: 'Bahrain', nameZh: '巴林', dialCode: '+973', flag: '🇧🇭' },
  { code: 'OM', name: 'Oman', nameZh: '阿曼', dialCode: '+968', flag: '🇴🇲' },
  { code: 'YE', name: 'Yemen', nameZh: '也门', dialCode: '+967', flag: '🇾🇪' },
  { code: 'JO', name: 'Jordan', nameZh: '约旦', dialCode: '+962', flag: '🇯🇴' },
  { code: 'LB', name: 'Lebanon', nameZh: '黎巴嫩', dialCode: '+961', flag: '🇱🇧' },
  { code: 'SY', name: 'Syria', nameZh: '叙利亚', dialCode: '+963', flag: '🇸🇾' },
  { code: 'IL', name: 'Israel', nameZh: '以色列', dialCode: '+972', flag: '🇮🇱' },
  { code: 'PS', name: 'Palestine', nameZh: '巴勒斯坦', dialCode: '+970', flag: '🇵🇸' },
  { code: 'TR', name: 'Turkey', nameZh: '土耳其', dialCode: '+90', flag: '🇹🇷' },
  { code: 'CY', name: 'Cyprus', nameZh: '塞浦路斯', dialCode: '+357', flag: '🇨🇾' },
  { code: 'GE', name: 'Georgia', nameZh: '格鲁吉亚', dialCode: '+995', flag: '🇬🇪' },
  { code: 'AM', name: 'Armenia', nameZh: '亚美尼亚', dialCode: '+374', flag: '🇦🇲' },
  { code: 'AZ', name: 'Azerbaijan', nameZh: '阿塞拜疆', dialCode: '+994', flag: '🇦🇿' },
  { code: 'EG', name: 'Egypt', nameZh: '埃及', dialCode: '+20', flag: '🇪🇬' },
  { code: 'LY', name: 'Libya', nameZh: '利比亚', dialCode: '+218', flag: '🇱🇾' },
  { code: 'TN', name: 'Tunisia', nameZh: '突尼斯', dialCode: '+216', flag: '🇹🇳' },
  { code: 'DZ', name: 'Algeria', nameZh: '阿尔及利亚', dialCode: '+213', flag: '🇩🇿' },
  { code: 'MA', name: 'Morocco', nameZh: '摩洛哥', dialCode: '+212', flag: '🇲🇦' },
  { code: 'SD', name: 'Sudan', nameZh: '苏丹', dialCode: '+249', flag: '🇸🇩' },
  { code: 'ET', name: 'Ethiopia', nameZh: '埃塞俄比亚', dialCode: '+251', flag: '🇪🇹' },
  { code: 'KE', name: 'Kenya', nameZh: '肯尼亚', dialCode: '+254', flag: '🇰🇪' },
  { code: 'UG', name: 'Uganda', nameZh: '乌干达', dialCode: '+256', flag: '🇺🇬' },
  { code: 'TZ', name: 'Tanzania', nameZh: '坦桑尼亚', dialCode: '+255', flag: '🇹🇿' },
  { code: 'RW', name: 'Rwanda', nameZh: '卢旺达', dialCode: '+250', flag: '🇷🇼' },
  { code: 'BI', name: 'Burundi', nameZh: '布隆迪', dialCode: '+257', flag: '🇧🇮' },
  { code: 'DJ', name: 'Djibouti', nameZh: '吉布提', dialCode: '+253', flag: '🇩🇯' },
  { code: 'SO', name: 'Somalia', nameZh: '索马里', dialCode: '+252', flag: '🇸🇴' },
  { code: 'ER', name: 'Eritrea', nameZh: '厄立特里亚', dialCode: '+291', flag: '🇪🇷' },
  { code: 'ZA', name: 'South Africa', nameZh: '南非', dialCode: '+27', flag: '🇿🇦' },
  { code: 'NA', name: 'Namibia', nameZh: '纳米比亚', dialCode: '+264', flag: '🇳🇦' },
  { code: 'BW', name: 'Botswana', nameZh: '博茨瓦纳', dialCode: '+267', flag: '🇧🇼' },
  { code: 'ZW', name: 'Zimbabwe', nameZh: '津巴布韦', dialCode: '+263', flag: '🇿🇼' },
  { code: 'ZM', name: 'Zambia', nameZh: '赞比亚', dialCode: '+260', flag: '🇿🇲' },
  { code: 'MW', name: 'Malawi', nameZh: '马拉维', dialCode: '+265', flag: '🇲🇼' },
  { code: 'MZ', name: 'Mozambique', nameZh: '莫桑比克', dialCode: '+258', flag: '🇲🇿' },
  { code: 'MG', name: 'Madagascar', nameZh: '马达加斯加', dialCode: '+261', flag: '🇲🇬' },
  { code: 'MU', name: 'Mauritius', nameZh: '毛里求斯', dialCode: '+230', flag: '🇲🇺' },
  { code: 'SC', name: 'Seychelles', nameZh: '塞舌尔', dialCode: '+248', flag: '🇸🇨' },
  { code: 'KM', name: 'Comoros', nameZh: '科摩罗', dialCode: '+269', flag: '🇰🇲' },
  { code: 'MX', name: 'Mexico', nameZh: '墨西哥', dialCode: '+52', flag: '🇲🇽' },
  { code: 'GT', name: 'Guatemala', nameZh: '危地马拉', dialCode: '+502', flag: '🇬🇹' },
  { code: 'BZ', name: 'Belize', nameZh: '伯利兹', dialCode: '+501', flag: '🇧🇿' },
  { code: 'SV', name: 'El Salvador', nameZh: '萨尔瓦多', dialCode: '+503', flag: '🇸🇻' },
  { code: 'HN', name: 'Honduras', nameZh: '洪都拉斯', dialCode: '+504', flag: '🇭🇳' },
  { code: 'NI', name: 'Nicaragua', nameZh: '尼加拉瓜', dialCode: '+505', flag: '🇳🇮' },
  { code: 'CR', name: 'Costa Rica', nameZh: '哥斯达黎加', dialCode: '+506', flag: '🇨🇷' },
  { code: 'PA', name: 'Panama', nameZh: '巴拿马', dialCode: '+507', flag: '🇵🇦' },
  { code: 'CU', name: 'Cuba', nameZh: '古巴', dialCode: '+53', flag: '🇨🇺' },
  { code: 'JM', name: 'Jamaica', nameZh: '牙买加', dialCode: '+1876', flag: '🇯🇲' },
  { code: 'HT', name: 'Haiti', nameZh: '海地', dialCode: '+509', flag: '🇭🇹' },
  { code: 'DO', name: 'Dominican Republic', nameZh: '多米尼加', dialCode: '+1809', flag: '🇩🇴' },
  { code: 'PR', name: 'Puerto Rico', nameZh: '波多黎各', dialCode: '+1787', flag: '🇵🇷' },
  { code: 'TT', name: 'Trinidad and Tobago', nameZh: '特立尼达和多巴哥', dialCode: '+1868', flag: '🇹🇹' },
  { code: 'BB', name: 'Barbados', nameZh: '巴巴多斯', dialCode: '+1246', flag: '🇧🇧' },
  { code: 'GD', name: 'Grenada', nameZh: '格林纳达', dialCode: '+1473', flag: '🇬🇩' },
  { code: 'LC', name: 'Saint Lucia', nameZh: '圣卢西亚', dialCode: '+1758', flag: '🇱🇨' },
  { code: 'VC', name: 'Saint Vincent and the Grenadines', nameZh: '圣文森特和格林纳丁斯', dialCode: '+1784', flag: '🇻🇨' },
  { code: 'AG', name: 'Antigua and Barbuda', nameZh: '安提瓜和巴布达', dialCode: '+1268', flag: '🇦🇬' },
  { code: 'DM', name: 'Dominica', nameZh: '多米尼克', dialCode: '+1767', flag: '🇩🇲' },
  { code: 'KN', name: 'Saint Kitts and Nevis', nameZh: '圣基茨和尼维斯', dialCode: '+1869', flag: '🇰🇳' },
  { code: 'BS', name: 'Bahamas', nameZh: '巴哈马', dialCode: '+1242', flag: '🇧🇸' },
  { code: 'BM', name: 'Bermuda', nameZh: '百慕大', dialCode: '+1441', flag: '🇧🇲' },
  { code: 'BR', name: 'Brazil', nameZh: '巴西', dialCode: '+55', flag: '🇧🇷' },
  { code: 'AR', name: 'Argentina', nameZh: '阿根廷', dialCode: '+54', flag: '🇦🇷' },
  { code: 'CL', name: 'Chile', nameZh: '智利', dialCode: '+56', flag: '🇨🇱' },
  { code: 'CO', name: 'Colombia', nameZh: '哥伦比亚', dialCode: '+57', flag: '🇨🇴' },
  { code: 'PE', name: 'Peru', nameZh: '秘鲁', dialCode: '+51', flag: '🇵🇪' },
  { code: 'VE', name: 'Venezuela', nameZh: '委内瑞拉', dialCode: '+58', flag: '🇻🇪' },
  { code: 'EC', name: 'Ecuador', nameZh: '厄瓜多尔', dialCode: '+593', flag: '🇪🇨' },
  { code: 'BO', name: 'Bolivia', nameZh: '玻利维亚', dialCode: '+591', flag: '🇧🇴' },
  { code: 'PY', name: 'Paraguay', nameZh: '巴拉圭', dialCode: '+595', flag: '🇵🇾' },
  { code: 'UY', name: 'Uruguay', nameZh: '乌拉圭', dialCode: '+598', flag: '🇺🇾' },
  { code: 'GY', name: 'Guyana', nameZh: '圭亚那', dialCode: '+592', flag: '🇬🇾' },
  { code: 'SR', name: 'Suriname', nameZh: '苏里南', dialCode: '+597', flag: '🇸🇷' },
  { code: 'GF', name: 'French Guiana', nameZh: '法属圭亚那', dialCode: '+594', flag: '🇬🇫' },
  { code: 'FK', name: 'Falkland Islands', nameZh: '福克兰群岛', dialCode: '+500', flag: '🇫🇰' },
  { code: 'NZ', name: 'New Zealand', nameZh: '新西兰', dialCode: '+64', flag: '🇳🇿' },
  { code: 'FJ', name: 'Fiji', nameZh: '斐济', dialCode: '+679', flag: '🇫🇯' },
  { code: 'PG', name: 'Papua New Guinea', nameZh: '巴布亚新几内亚', dialCode: '+675', flag: '🇵🇬' },
  { code: 'NC', name: 'New Caledonia', nameZh: '新喀里多尼亚', dialCode: '+687', flag: '🇳🇨' },
  { code: 'VU', name: 'Vanuatu', nameZh: '瓦努阿图', dialCode: '+678', flag: '🇻🇺' },
  { code: 'SB', name: 'Solomon Islands', nameZh: '所罗门群岛', dialCode: '+677', flag: '🇸🇧' },
  { code: 'TO', name: 'Tonga', nameZh: '汤加', dialCode: '+676', flag: '🇹🇴' },
  { code: 'WS', name: 'Samoa', nameZh: '萨摩亚', dialCode: '+685', flag: '🇼🇸' },
  { code: 'KI', name: 'Kiribati', nameZh: '基里巴斯', dialCode: '+686', flag: '🇰🇮' },
  { code: 'TV', name: 'Tuvalu', nameZh: '图瓦卢', dialCode: '+688', flag: '🇹🇻' },
  { code: 'NR', name: 'Nauru', nameZh: '瑙鲁', dialCode: '+674', flag: '🇳🇷' },
  { code: 'PW', name: 'Palau', nameZh: '帕劳', dialCode: '+680', flag: '🇵🇼' },
  { code: 'FM', name: 'Micronesia', nameZh: '密克罗尼西亚', dialCode: '+691', flag: '🇫🇲' },
  { code: 'MH', name: 'Marshall Islands', nameZh: '马绍尔群岛', dialCode: '+692', flag: '🇲🇭' },
];

interface CountryCodeSelectorProps {
  value: string;
  onChange: (countryCode: string) => void;
  label?: string;
  size?: 'small' | 'medium';
  fullWidth?: boolean;
  disabled?: boolean;
  container?: HTMLElement | null;
}

const CountryCodeSelector: React.FC<CountryCodeSelectorProps> = ({
  value,
  onChange,
  label = 'Country Code',
  size = 'medium',
  fullWidth = false,
  disabled = false,
  container,
}) => {
  const { i18n } = useTranslation();
  const isZh = i18n.language === 'zh-CN';

  // 清理拨号代码显示（去掉国家后缀）
  const getDisplayDialCode = (dialCode: string) => {
    return dialCode.replace(/-[A-Z]{2}$/, '');
  };

  return (
    <TextField
      select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      label={label}
      size={size}
      fullWidth={fullWidth}
      disabled={disabled}
      SelectProps={{
        MenuProps: {
          container: container,
          disablePortal: false,
          PaperProps: {
            style: {
              maxHeight: 300,
              zIndex: 10001,
            },
          },
          anchorOrigin: {
            vertical: 'bottom',
            horizontal: 'left',
          },
          transformOrigin: {
            vertical: 'top',
            horizontal: 'left',
          },
          style: {
            zIndex: 10001,
          },
        },
        renderValue: (selected) => {
          const country = countryCodes.find(c => c.dialCode === selected);
          if (!country) return String(selected);
          return (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
              <Box sx={{ fontSize: '1.2rem', lineHeight: 1 }}>
                {country.flag}
              </Box>
              <Box sx={{
                fontWeight: 500,
                fontSize: '0.875rem',
                color: 'text.primary',
              }}>
                {getDisplayDialCode(country.dialCode)}
              </Box>
            </Box>
          );
        },
      }}
      sx={{
        '& .MuiOutlinedInput-root': {
          borderRadius: 2,
        },
      }}
    >
      {countryCodes.map((country) => (
        <MenuItem key={country.code} value={country.dialCode}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
            <Box sx={{ fontSize: '1.2rem', lineHeight: 1 }}>
              {country.flag}
            </Box>
            <Box sx={{
              fontWeight: 500,
              fontSize: '0.875rem',
              color: 'text.secondary',
              minWidth: 45,
            }}>
              {getDisplayDialCode(country.dialCode)}
            </Box>
            <Box sx={{
              fontSize: '0.875rem',
              color: 'text.primary',
            }}>
              {isZh ? (country.nameZh || country.name) : country.name}
            </Box>
          </Box>
        </MenuItem>
      ))}
    </TextField>
  );
};

export default CountryCodeSelector;
