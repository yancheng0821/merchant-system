/**
 * 国家和省份/州数据
 * 维护主流国家及其行政区划
 */

export interface Province {
  value: string;
  label: string;
  labelEn: string;
  labelZh: string;
}

export interface Country {
  value: string;
  label: string;
  labelEn: string;
  labelZh: string;
  code: string; // ISO 3166-1 alpha-2 国家代码
  provinces: Province[];
}

/**
 * 国家和省份数据
 */
export const COUNTRIES: Country[] = [
  {
    value: 'Canada',
    label: 'Canada',
    labelEn: 'Canada',
    labelZh: '加拿大',
    code: 'CA',
    provinces: [
      { value: 'Alberta', label: 'Alberta', labelEn: 'Alberta', labelZh: '艾伯塔省' },
      { value: 'British Columbia', label: 'British Columbia', labelEn: 'British Columbia', labelZh: '不列颠哥伦比亚省' },
      { value: 'Manitoba', label: 'Manitoba', labelEn: 'Manitoba', labelZh: '曼尼托巴省' },
      { value: 'New Brunswick', label: 'New Brunswick', labelEn: 'New Brunswick', labelZh: '新不伦瑞克省' },
      { value: 'Newfoundland and Labrador', label: 'Newfoundland and Labrador', labelEn: 'Newfoundland and Labrador', labelZh: '纽芬兰与拉布拉多省' },
      { value: 'Nova Scotia', label: 'Nova Scotia', labelEn: 'Nova Scotia', labelZh: '新斯科舍省' },
      { value: 'Ontario', label: 'Ontario', labelEn: 'Ontario', labelZh: '安大略省' },
      { value: 'Prince Edward Island', label: 'Prince Edward Island', labelEn: 'Prince Edward Island', labelZh: '爱德华王子岛省' },
      { value: 'Quebec', label: 'Quebec', labelEn: 'Quebec', labelZh: '魁北克省' },
      { value: 'Saskatchewan', label: 'Saskatchewan', labelEn: 'Saskatchewan', labelZh: '萨斯喀彻温省' },
      { value: 'Northwest Territories', label: 'Northwest Territories', labelEn: 'Northwest Territories', labelZh: '西北地区' },
      { value: 'Nunavut', label: 'Nunavut', labelEn: 'Nunavut', labelZh: '努纳武特地区' },
      { value: 'Yukon', label: 'Yukon', labelEn: 'Yukon', labelZh: '育空地区' }
    ]
  },
  {
    value: 'United States',
    label: 'United States',
    labelEn: 'United States',
    labelZh: '美国',
    code: 'US',
    provinces: [
      { value: 'Alabama', label: 'Alabama', labelEn: 'Alabama', labelZh: '阿拉巴马州' },
      { value: 'Alaska', label: 'Alaska', labelEn: 'Alaska', labelZh: '阿拉斯加州' },
      { value: 'Arizona', label: 'Arizona', labelEn: 'Arizona', labelZh: '亚利桑那州' },
      { value: 'Arkansas', label: 'Arkansas', labelEn: 'Arkansas', labelZh: '阿肯色州' },
      { value: 'California', label: 'California', labelEn: 'California', labelZh: '加利福尼亚州' },
      { value: 'Colorado', label: 'Colorado', labelEn: 'Colorado', labelZh: '科罗拉多州' },
      { value: 'Connecticut', label: 'Connecticut', labelEn: 'Connecticut', labelZh: '康涅狄格州' },
      { value: 'Delaware', label: 'Delaware', labelEn: 'Delaware', labelZh: '特拉华州' },
      { value: 'Florida', label: 'Florida', labelEn: 'Florida', labelZh: '佛罗里达州' },
      { value: 'Georgia', label: 'Georgia', labelEn: 'Georgia', labelZh: '佐治亚州' },
      { value: 'Hawaii', label: 'Hawaii', labelEn: 'Hawaii', labelZh: '夏威夷州' },
      { value: 'Idaho', label: 'Idaho', labelEn: 'Idaho', labelZh: '爱达荷州' },
      { value: 'Illinois', label: 'Illinois', labelEn: 'Illinois', labelZh: '伊利诺伊州' },
      { value: 'Indiana', label: 'Indiana', labelEn: 'Indiana', labelZh: '印第安纳州' },
      { value: 'Iowa', label: 'Iowa', labelEn: 'Iowa', labelZh: '艾奥瓦州' },
      { value: 'Kansas', label: 'Kansas', labelEn: 'Kansas', labelZh: '堪萨斯州' },
      { value: 'Kentucky', label: 'Kentucky', labelEn: 'Kentucky', labelZh: '肯塔基州' },
      { value: 'Louisiana', label: 'Louisiana', labelEn: 'Louisiana', labelZh: '路易斯安那州' },
      { value: 'Maine', label: 'Maine', labelEn: 'Maine', labelZh: '缅因州' },
      { value: 'Maryland', label: 'Maryland', labelEn: 'Maryland', labelZh: '马里兰州' },
      { value: 'Massachusetts', label: 'Massachusetts', labelEn: 'Massachusetts', labelZh: '马萨诸塞州' },
      { value: 'Michigan', label: 'Michigan', labelEn: 'Michigan', labelZh: '密歇根州' },
      { value: 'Minnesota', label: 'Minnesota', labelEn: 'Minnesota', labelZh: '明尼苏达州' },
      { value: 'Mississippi', label: 'Mississippi', labelEn: 'Mississippi', labelZh: '密西西比州' },
      { value: 'Missouri', label: 'Missouri', labelEn: 'Missouri', labelZh: '密苏里州' },
      { value: 'Montana', label: 'Montana', labelEn: 'Montana', labelZh: '蒙大拿州' },
      { value: 'Nebraska', label: 'Nebraska', labelEn: 'Nebraska', labelZh: '内布拉斯加州' },
      { value: 'Nevada', label: 'Nevada', labelEn: 'Nevada', labelZh: '内华达州' },
      { value: 'New Hampshire', label: 'New Hampshire', labelEn: 'New Hampshire', labelZh: '新罕布什尔州' },
      { value: 'New Jersey', label: 'New Jersey', labelEn: 'New Jersey', labelZh: '新泽西州' },
      { value: 'New Mexico', label: 'New Mexico', labelEn: 'New Mexico', labelZh: '新墨西哥州' },
      { value: 'New York', label: 'New York', labelEn: 'New York', labelZh: '纽约州' },
      { value: 'North Carolina', label: 'North Carolina', labelEn: 'North Carolina', labelZh: '北卡罗来纳州' },
      { value: 'North Dakota', label: 'North Dakota', labelEn: 'North Dakota', labelZh: '北达科他州' },
      { value: 'Ohio', label: 'Ohio', labelEn: 'Ohio', labelZh: '俄亥俄州' },
      { value: 'Oklahoma', label: 'Oklahoma', labelEn: 'Oklahoma', labelZh: '俄克拉荷马州' },
      { value: 'Oregon', label: 'Oregon', labelEn: 'Oregon', labelZh: '俄勒冈州' },
      { value: 'Pennsylvania', label: 'Pennsylvania', labelEn: 'Pennsylvania', labelZh: '宾夕法尼亚州' },
      { value: 'Rhode Island', label: 'Rhode Island', labelEn: 'Rhode Island', labelZh: '罗得岛州' },
      { value: 'South Carolina', label: 'South Carolina', labelEn: 'South Carolina', labelZh: '南卡罗来纳州' },
      { value: 'South Dakota', label: 'South Dakota', labelEn: 'South Dakota', labelZh: '南达科他州' },
      { value: 'Tennessee', label: 'Tennessee', labelEn: 'Tennessee', labelZh: '田纳西州' },
      { value: 'Texas', label: 'Texas', labelEn: 'Texas', labelZh: '得克萨斯州' },
      { value: 'Utah', label: 'Utah', labelEn: 'Utah', labelZh: '犹他州' },
      { value: 'Vermont', label: 'Vermont', labelEn: 'Vermont', labelZh: '佛蒙特州' },
      { value: 'Virginia', label: 'Virginia', labelEn: 'Virginia', labelZh: '弗吉尼亚州' },
      { value: 'Washington', label: 'Washington', labelEn: 'Washington', labelZh: '华盛顿州' },
      { value: 'West Virginia', label: 'West Virginia', labelEn: 'West Virginia', labelZh: '西弗吉尼亚州' },
      { value: 'Wisconsin', label: 'Wisconsin', labelEn: 'Wisconsin', labelZh: '威斯康星州' },
      { value: 'Wyoming', label: 'Wyoming', labelEn: 'Wyoming', labelZh: '怀俄明州' }
    ]
  },
  {
    value: 'China',
    label: 'China',
    labelEn: 'China',
    labelZh: '中国',
    code: 'CN',
    provinces: [
      // 直辖市 (4)
      { value: 'Beijing', label: 'Beijing', labelEn: 'Beijing', labelZh: '北京市' },
      { value: 'Shanghai', label: 'Shanghai', labelEn: 'Shanghai', labelZh: '上海市' },
      { value: 'Tianjin', label: 'Tianjin', labelEn: 'Tianjin', labelZh: '天津市' },
      { value: 'Chongqing', label: 'Chongqing', labelEn: 'Chongqing', labelZh: '重庆市' },

      // 省份 (23) - 按拼音排序
      { value: 'Anhui', label: 'Anhui', labelEn: 'Anhui', labelZh: '安徽省' },
      { value: 'Fujian', label: 'Fujian', labelEn: 'Fujian', labelZh: '福建省' },
      { value: 'Gansu', label: 'Gansu', labelEn: 'Gansu', labelZh: '甘肃省' },
      { value: 'Guangdong', label: 'Guangdong', labelEn: 'Guangdong', labelZh: '广东省' },
      { value: 'Guizhou', label: 'Guizhou', labelEn: 'Guizhou', labelZh: '贵州省' },
      { value: 'Hainan', label: 'Hainan', labelEn: 'Hainan', labelZh: '海南省' },
      { value: 'Hebei', label: 'Hebei', labelEn: 'Hebei', labelZh: '河北省' },
      { value: 'Heilongjiang', label: 'Heilongjiang', labelEn: 'Heilongjiang', labelZh: '黑龙江省' },
      { value: 'Henan', label: 'Henan', labelEn: 'Henan', labelZh: '河南省' },
      { value: 'Hubei', label: 'Hubei', labelEn: 'Hubei', labelZh: '湖北省' },
      { value: 'Hunan', label: 'Hunan', labelEn: 'Hunan', labelZh: '湖南省' },
      { value: 'Jiangsu', label: 'Jiangsu', labelEn: 'Jiangsu', labelZh: '江苏省' },
      { value: 'Jiangxi', label: 'Jiangxi', labelEn: 'Jiangxi', labelZh: '江西省' },
      { value: 'Jilin', label: 'Jilin', labelEn: 'Jilin', labelZh: '吉林省' },
      { value: 'Liaoning', label: 'Liaoning', labelEn: 'Liaoning', labelZh: '辽宁省' },
      { value: 'Qinghai', label: 'Qinghai', labelEn: 'Qinghai', labelZh: '青海省' },
      { value: 'Shaanxi', label: 'Shaanxi', labelEn: 'Shaanxi', labelZh: '陕西省' },
      { value: 'Shandong', label: 'Shandong', labelEn: 'Shandong', labelZh: '山东省' },
      { value: 'Shanxi', label: 'Shanxi', labelEn: 'Shanxi', labelZh: '山西省' },
      { value: 'Sichuan', label: 'Sichuan', labelEn: 'Sichuan', labelZh: '四川省' },
      { value: 'Taiwan', label: 'Taiwan', labelEn: 'Taiwan', labelZh: '台湾省' },
      { value: 'Yunnan', label: 'Yunnan', labelEn: 'Yunnan', labelZh: '云南省' },
      { value: 'Zhejiang', label: 'Zhejiang', labelEn: 'Zhejiang', labelZh: '浙江省' },

      // 自治区 (5)
      { value: 'Guangxi', label: 'Guangxi', labelEn: 'Guangxi Zhuang Autonomous Region', labelZh: '广西壮族自治区' },
      { value: 'Inner Mongolia', label: 'Inner Mongolia', labelEn: 'Inner Mongolia Autonomous Region', labelZh: '内蒙古自治区' },
      { value: 'Ningxia', label: 'Ningxia', labelEn: 'Ningxia Hui Autonomous Region', labelZh: '宁夏回族自治区' },
      { value: 'Tibet', label: 'Tibet', labelEn: 'Tibet Autonomous Region', labelZh: '西藏自治区' },
      { value: 'Xinjiang', label: 'Xinjiang', labelEn: 'Xinjiang Uyghur Autonomous Region', labelZh: '新疆维吾尔自治区' },

      // 特别行政区 (2)
      { value: 'Hong Kong', label: 'Hong Kong', labelEn: 'Hong Kong SAR', labelZh: '香港特别行政区' },
      { value: 'Macau', label: 'Macau', labelEn: 'Macau SAR', labelZh: '澳门特别行政区' }
    ]
  },
  {
    value: 'United Kingdom',
    label: 'United Kingdom',
    labelEn: 'United Kingdom',
    labelZh: '英国',
    code: 'GB',
    provinces: [
      { value: 'England', label: 'England', labelEn: 'England', labelZh: '英格兰' },
      { value: 'Scotland', label: 'Scotland', labelEn: 'Scotland', labelZh: '苏格兰' },
      { value: 'Wales', label: 'Wales', labelEn: 'Wales', labelZh: '威尔士' },
      { value: 'Northern Ireland', label: 'Northern Ireland', labelEn: 'Northern Ireland', labelZh: '北爱尔兰' }
    ]
  },
  {
    value: 'Australia',
    label: 'Australia',
    labelEn: 'Australia',
    labelZh: '澳大利亚',
    code: 'AU',
    provinces: [
      { value: 'New South Wales', label: 'New South Wales', labelEn: 'New South Wales', labelZh: '新南威尔士州' },
      { value: 'Victoria', label: 'Victoria', labelEn: 'Victoria', labelZh: '维多利亚州' },
      { value: 'Queensland', label: 'Queensland', labelEn: 'Queensland', labelZh: '昆士兰州' },
      { value: 'Western Australia', label: 'Western Australia', labelEn: 'Western Australia', labelZh: '西澳大利亚州' },
      { value: 'South Australia', label: 'South Australia', labelEn: 'South Australia', labelZh: '南澳大利亚州' },
      { value: 'Tasmania', label: 'Tasmania', labelEn: 'Tasmania', labelZh: '塔斯马尼亚州' },
      { value: 'Australian Capital Territory', label: 'Australian Capital Territory', labelEn: 'Australian Capital Territory', labelZh: '澳大利亚首都领地' },
      { value: 'Northern Territory', label: 'Northern Territory', labelEn: 'Northern Territory', labelZh: '北领地' }
    ]
  },
  {
    value: 'Other',
    label: 'Other',
    labelEn: 'Other',
    labelZh: '其他',
    code: 'OT',
    provinces: []
  }
];

/**
 * 根据国家名称获取国家信息
 */
export const getCountryByValue = (countryValue: string): Country | undefined => {
  return COUNTRIES.find(country => country.value === countryValue);
};

/**
 * 根据国家代码获取国家信息
 */
export const getCountryByCode = (countryCode: string): Country | undefined => {
  return COUNTRIES.find(country => country.code.toLowerCase() === countryCode.toLowerCase());
};

/**
 * 根据国家获取省份列表
 */
export const getProvincesByCountry = (countryValue: string): Province[] => {
  const country = getCountryByValue(countryValue);
  return country?.provinces || [];
};
