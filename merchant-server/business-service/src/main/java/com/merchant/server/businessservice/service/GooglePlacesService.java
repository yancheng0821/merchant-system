package com.merchant.server.businessservice.service;

import java.util.List;

/**
 * Google Places API 服务接口
 * 用于根据商户地址自动查询 Google Place ID
 */
public interface GooglePlacesService {

    /**
     * 根据商户名称和地址搜索 Place ID
     * @param businessName 商户名称
     * @param address 完整地址
     * @return Place ID，如果未找到返回 null
     */
    String findPlaceId(String businessName, String address);

    /**
     * 搜索匹配的商户列表
     * @param businessName 商户名称
     * @param address 地址
     * @return 匹配的商户列表
     */
    List<PlaceSearchResult> searchPlaces(String businessName, String address);

    /**
     * 地址自动补全
     * @param input 用户输入的地址文本
     * @param countryCode 国家代码（如 "ca", "us"），可选
     * @return 自动补全建议列表
     */
    List<AutocompleteResult> autocomplete(String input, String countryCode);

    /**
     * 获取地点详情
     * @param placeId Google Place ID
     * @return 地点详情，包含解析后的地址组件
     */
    PlaceDetails getPlaceDetails(String placeId);

    /**
     * Place 搜索结果
     */
    class PlaceSearchResult {
        private String placeId;
        private String name;
        private String formattedAddress;

        public PlaceSearchResult() {}

        public PlaceSearchResult(String placeId, String name, String formattedAddress) {
            this.placeId = placeId;
            this.name = name;
            this.formattedAddress = formattedAddress;
        }

        public String getPlaceId() { return placeId; }
        public void setPlaceId(String placeId) { this.placeId = placeId; }

        public String getName() { return name; }
        public void setName(String name) { this.name = name; }

        public String getFormattedAddress() { return formattedAddress; }
        public void setFormattedAddress(String formattedAddress) { this.formattedAddress = formattedAddress; }
    }

    /**
     * 自动补全结果
     */
    class AutocompleteResult {
        private String placeId;
        private String description;  // 完整的地址描述
        private String mainText;     // 主要文本（如街道地址）
        private String secondaryText; // 次要文本（如城市、省份）

        public AutocompleteResult() {}

        public AutocompleteResult(String placeId, String description, String mainText, String secondaryText) {
            this.placeId = placeId;
            this.description = description;
            this.mainText = mainText;
            this.secondaryText = secondaryText;
        }

        public String getPlaceId() { return placeId; }
        public void setPlaceId(String placeId) { this.placeId = placeId; }

        public String getDescription() { return description; }
        public void setDescription(String description) { this.description = description; }

        public String getMainText() { return mainText; }
        public void setMainText(String mainText) { this.mainText = mainText; }

        public String getSecondaryText() { return secondaryText; }
        public void setSecondaryText(String secondaryText) { this.secondaryText = secondaryText; }
    }

    /**
     * 地点详情（包含解析后的地址组件）
     */
    class PlaceDetails {
        private String placeId;
        private String formattedAddress;
        private String streetAddress;
        private String city;
        private String province;
        private String country;
        private String postalCode;
        private String name;

        public PlaceDetails() {}

        public String getPlaceId() { return placeId; }
        public void setPlaceId(String placeId) { this.placeId = placeId; }

        public String getFormattedAddress() { return formattedAddress; }
        public void setFormattedAddress(String formattedAddress) { this.formattedAddress = formattedAddress; }

        public String getStreetAddress() { return streetAddress; }
        public void setStreetAddress(String streetAddress) { this.streetAddress = streetAddress; }

        public String getCity() { return city; }
        public void setCity(String city) { this.city = city; }

        public String getProvince() { return province; }
        public void setProvince(String province) { this.province = province; }

        public String getCountry() { return country; }
        public void setCountry(String country) { this.country = country; }

        public String getPostalCode() { return postalCode; }
        public void setPostalCode(String postalCode) { this.postalCode = postalCode; }

        public String getName() { return name; }
        public void setName(String name) { this.name = name; }
    }
}
