package com.merchant.server.businessservice.service.impl;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.merchant.server.businessservice.service.GooglePlacesService;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.*;
import org.springframework.http.client.SimpleClientHttpRequestFactory;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;
import org.springframework.web.client.RestTemplate;
import org.springframework.web.util.UriComponentsBuilder;

import java.util.ArrayList;
import java.util.Collections;
import java.util.List;

/**
 * Google Places API 服务实现
 * 使用 Text Search API 根据商户名称和地址查询 Place ID
 */
@Slf4j
@Service
public class GooglePlacesServiceImpl implements GooglePlacesService {

    private final String apiKey;
    private final RestTemplate restTemplate;
    private final ObjectMapper objectMapper;

    private static final String PLACES_API_BASE = "https://maps.googleapis.com/maps/api/place";
    private static final String TEXT_SEARCH_ENDPOINT = "/textsearch/json";
    private static final String FIND_PLACE_ENDPOINT = "/findplacefromtext/json";
    private static final String AUTOCOMPLETE_ENDPOINT = "/autocomplete/json";
    private static final String DETAILS_ENDPOINT = "/details/json";

    public GooglePlacesServiceImpl(
            @Value("${google.places.api-key:}") String apiKey,
            @Value("${google.places.timeout:10000}") int timeout) {
        this.apiKey = apiKey;
        // 创建独立的 RestTemplate 用于外部 API 调用（不使用 LoadBalanced）
        SimpleClientHttpRequestFactory factory = new SimpleClientHttpRequestFactory();
        factory.setConnectTimeout(timeout);
        factory.setReadTimeout(timeout);
        this.restTemplate = new RestTemplate(factory);
        this.objectMapper = new ObjectMapper();
        log.info("GooglePlacesService initialized, API key configured: {}", StringUtils.hasText(apiKey));
    }

    @Override
    public String findPlaceId(String businessName, String address) {
        if (!isApiKeyConfigured()) {
            log.warn("Google Places API key not configured");
            return null;
        }

        List<PlaceSearchResult> results = searchPlaces(businessName, address);
        if (results != null && !results.isEmpty()) {
            return results.get(0).getPlaceId();
        }
        return null;
    }

    @Override
    public List<PlaceSearchResult> searchPlaces(String businessName, String address) {
        if (!isApiKeyConfigured()) {
            log.warn("Google Places API key not configured");
            return Collections.emptyList();
        }

        try {
            // 首先尝试使用 Find Place 精确匹配
            List<PlaceSearchResult> results = findPlaceFromText(businessName, address);
            if (!results.isEmpty()) {
                return results;
            }

            // 如果没有结果，尝试 Text Search
            return textSearch(businessName, address);

        } catch (Exception e) {
            log.error("Error searching Google Places: {}", e.getMessage(), e);
            return Collections.emptyList();
        }
    }

    /**
     * 使用 Find Place From Text API（更精确）
     */
    private List<PlaceSearchResult> findPlaceFromText(String businessName, String address) {
        try {
            String query = buildSearchQuery(businessName, address);

            String url = PLACES_API_BASE + FIND_PLACE_ENDPOINT +
                "?input=" + java.net.URLEncoder.encode(query, java.nio.charset.StandardCharsets.UTF_8) +
                "&inputtype=textquery" +
                "&fields=place_id,name,formatted_address" +
                "&key=" + apiKey;

            log.info("Find Place API URL: {}", url.replaceAll("key=[^&]+", "key=***"));

            ResponseEntity<String> response = restTemplate.getForEntity(url, String.class);

            if (response.getStatusCode() == HttpStatus.OK && response.getBody() != null) {
                return parseFindPlaceResponse(response.getBody());
            }

        } catch (Exception e) {
            log.warn("Find Place API error: {}", e.getMessage());
        }
        return Collections.emptyList();
    }

    /**
     * 使用 Text Search API（更广泛的搜索）
     */
    private List<PlaceSearchResult> textSearch(String businessName, String address) {
        try {
            String query = buildSearchQuery(businessName, address);

            String url = PLACES_API_BASE + TEXT_SEARCH_ENDPOINT +
                "?query=" + java.net.URLEncoder.encode(query, java.nio.charset.StandardCharsets.UTF_8) +
                "&key=" + apiKey;

            log.info("Text Search API URL: {}", url.replaceAll("key=[^&]+", "key=***"));

            ResponseEntity<String> response = restTemplate.getForEntity(url, String.class);

            if (response.getStatusCode() == HttpStatus.OK && response.getBody() != null) {
                return parseTextSearchResponse(response.getBody());
            }

        } catch (Exception e) {
            log.warn("Text Search API error: {}", e.getMessage());
        }
        return Collections.emptyList();
    }

    /**
     * 构建搜索查询字符串
     */
    private String buildSearchQuery(String businessName, String address) {
        StringBuilder query = new StringBuilder();

        if (StringUtils.hasText(businessName)) {
            query.append(businessName.trim());
        }

        if (StringUtils.hasText(address)) {
            if (query.length() > 0) {
                query.append(" ");
            }
            query.append(address.trim());
        }

        return query.toString();
    }

    /**
     * 解析 Find Place API 响应
     */
    private List<PlaceSearchResult> parseFindPlaceResponse(String responseBody) {
        List<PlaceSearchResult> results = new ArrayList<>();
        try {
            JsonNode root = objectMapper.readTree(responseBody);
            String status = root.path("status").asText();

            if (!"OK".equals(status) && !"ZERO_RESULTS".equals(status)) {
                log.warn("Find Place API status: {}, error: {}",
                    status, root.path("error_message").asText(""));
                return results;
            }

            JsonNode candidates = root.path("candidates");
            if (candidates.isArray()) {
                for (JsonNode candidate : candidates) {
                    PlaceSearchResult result = new PlaceSearchResult();
                    result.setPlaceId(candidate.path("place_id").asText(null));
                    result.setName(candidate.path("name").asText(null));
                    result.setFormattedAddress(candidate.path("formatted_address").asText(null));

                    if (StringUtils.hasText(result.getPlaceId())) {
                        results.add(result);
                    }
                }
            }

        } catch (Exception e) {
            log.error("Error parsing Find Place response: {}", e.getMessage());
        }
        return results;
    }

    /**
     * 解析 Text Search API 响应
     */
    private List<PlaceSearchResult> parseTextSearchResponse(String responseBody) {
        List<PlaceSearchResult> results = new ArrayList<>();
        try {
            JsonNode root = objectMapper.readTree(responseBody);
            String status = root.path("status").asText();

            if (!"OK".equals(status) && !"ZERO_RESULTS".equals(status)) {
                log.warn("Text Search API status: {}, error: {}",
                    status, root.path("error_message").asText(""));
                return results;
            }

            JsonNode resultsArray = root.path("results");
            if (resultsArray.isArray()) {
                int count = 0;
                for (JsonNode item : resultsArray) {
                    if (count >= 5) break; // 最多返回5个结果

                    PlaceSearchResult result = new PlaceSearchResult();
                    result.setPlaceId(item.path("place_id").asText(null));
                    result.setName(item.path("name").asText(null));
                    result.setFormattedAddress(item.path("formatted_address").asText(null));

                    if (StringUtils.hasText(result.getPlaceId())) {
                        results.add(result);
                        count++;
                    }
                }
            }

        } catch (Exception e) {
            log.error("Error parsing Text Search response: {}", e.getMessage());
        }
        return results;
    }

    @Override
    public List<AutocompleteResult> autocomplete(String input, String countryCode) {
        if (!isApiKeyConfigured()) {
            log.warn("Google Places API key not configured");
            return Collections.emptyList();
        }

        if (!StringUtils.hasText(input)) {
            return Collections.emptyList();
        }

        try {
            StringBuilder urlBuilder = new StringBuilder();
            urlBuilder.append(PLACES_API_BASE).append(AUTOCOMPLETE_ENDPOINT);
            urlBuilder.append("?input=").append(java.net.URLEncoder.encode(input, java.nio.charset.StandardCharsets.UTF_8));
            urlBuilder.append("&types=address");  // 限制为地址类型
            urlBuilder.append("&key=").append(apiKey);

            // 如果指定了国家代码，添加国家限制
            if (StringUtils.hasText(countryCode)) {
                urlBuilder.append("&components=country:").append(countryCode.toLowerCase());
            }

            String url = urlBuilder.toString();
            log.debug("Autocomplete API URL: {}", url.replaceAll("key=[^&]+", "key=***"));

            ResponseEntity<String> response = restTemplate.getForEntity(url, String.class);

            if (response.getStatusCode() == HttpStatus.OK && response.getBody() != null) {
                return parseAutocompleteResponse(response.getBody());
            }

        } catch (Exception e) {
            log.error("Autocomplete API error: {}", e.getMessage(), e);
        }
        return Collections.emptyList();
    }

    @Override
    public PlaceDetails getPlaceDetails(String placeId) {
        if (!isApiKeyConfigured()) {
            log.warn("Google Places API key not configured");
            return null;
        }

        if (!StringUtils.hasText(placeId)) {
            return null;
        }

        try {
            String url = PLACES_API_BASE + DETAILS_ENDPOINT +
                "?place_id=" + java.net.URLEncoder.encode(placeId, java.nio.charset.StandardCharsets.UTF_8) +
                "&fields=place_id,name,formatted_address,address_components" +
                "&key=" + apiKey;

            log.debug("Place Details API URL: {}", url.replaceAll("key=[^&]+", "key=***"));

            ResponseEntity<String> response = restTemplate.getForEntity(url, String.class);

            if (response.getStatusCode() == HttpStatus.OK && response.getBody() != null) {
                return parsePlaceDetailsResponse(response.getBody());
            }

        } catch (Exception e) {
            log.error("Place Details API error: {}", e.getMessage(), e);
        }
        return null;
    }

    /**
     * 解析 Autocomplete API 响应
     */
    private List<AutocompleteResult> parseAutocompleteResponse(String responseBody) {
        List<AutocompleteResult> results = new ArrayList<>();
        try {
            JsonNode root = objectMapper.readTree(responseBody);
            String status = root.path("status").asText();

            if (!"OK".equals(status) && !"ZERO_RESULTS".equals(status)) {
                log.warn("Autocomplete API status: {}, error: {}",
                    status, root.path("error_message").asText(""));
                return results;
            }

            JsonNode predictions = root.path("predictions");
            if (predictions.isArray()) {
                for (JsonNode prediction : predictions) {
                    AutocompleteResult result = new AutocompleteResult();
                    result.setPlaceId(prediction.path("place_id").asText(null));
                    result.setDescription(prediction.path("description").asText(null));

                    // 解析 structured_formatting
                    JsonNode structuredFormatting = prediction.path("structured_formatting");
                    if (!structuredFormatting.isMissingNode()) {
                        result.setMainText(structuredFormatting.path("main_text").asText(null));
                        result.setSecondaryText(structuredFormatting.path("secondary_text").asText(null));
                    }

                    if (StringUtils.hasText(result.getPlaceId())) {
                        results.add(result);
                    }
                }
            }

        } catch (Exception e) {
            log.error("Error parsing Autocomplete response: {}", e.getMessage());
        }
        return results;
    }

    /**
     * 解析 Place Details API 响应
     */
    private PlaceDetails parsePlaceDetailsResponse(String responseBody) {
        try {
            JsonNode root = objectMapper.readTree(responseBody);
            String status = root.path("status").asText();

            if (!"OK".equals(status)) {
                log.warn("Place Details API status: {}, error: {}",
                    status, root.path("error_message").asText(""));
                return null;
            }

            JsonNode result = root.path("result");
            if (result.isMissingNode()) {
                return null;
            }

            PlaceDetails details = new PlaceDetails();
            details.setPlaceId(result.path("place_id").asText(null));
            details.setFormattedAddress(result.path("formatted_address").asText(null));
            details.setName(result.path("name").asText(null));

            // 解析地址组件
            JsonNode addressComponents = result.path("address_components");
            if (addressComponents.isArray()) {
                StringBuilder streetNumber = new StringBuilder();
                StringBuilder route = new StringBuilder();

                for (JsonNode component : addressComponents) {
                    JsonNode types = component.path("types");
                    String longName = component.path("long_name").asText("");

                    if (containsType(types, "street_number")) {
                        streetNumber.append(longName);
                    } else if (containsType(types, "route")) {
                        route.append(longName);
                    } else if (containsType(types, "locality")) {
                        details.setCity(longName);
                    } else if (containsType(types, "sublocality_level_1") && details.getCity() == null) {
                        details.setCity(longName);
                    } else if (containsType(types, "administrative_area_level_2") && details.getCity() == null) {
                        details.setCity(longName);
                    } else if (containsType(types, "administrative_area_level_1")) {
                        details.setProvince(longName);
                    } else if (containsType(types, "country")) {
                        details.setCountry(longName);
                    } else if (containsType(types, "postal_code")) {
                        details.setPostalCode(longName);
                    }
                }

                // 组合街道地址
                String streetAddress = streetNumber.toString();
                if (route.length() > 0) {
                    if (streetAddress.length() > 0) {
                        streetAddress += " ";
                    }
                    streetAddress += route.toString();
                }
                details.setStreetAddress(streetAddress);

                // 如果没有街道地址，使用名称
                if (!StringUtils.hasText(details.getStreetAddress()) && StringUtils.hasText(details.getName())) {
                    details.setStreetAddress(details.getName());
                }
            }

            return details;

        } catch (Exception e) {
            log.error("Error parsing Place Details response: {}", e.getMessage());
        }
        return null;
    }

    /**
     * 检查 types 数组是否包含指定类型
     */
    private boolean containsType(JsonNode types, String type) {
        if (types.isArray()) {
            for (JsonNode t : types) {
                if (type.equals(t.asText())) {
                    return true;
                }
            }
        }
        return false;
    }

    /**
     * 检查 API Key 是否已配置
     */
    private boolean isApiKeyConfigured() {
        return StringUtils.hasText(apiKey);
    }
}
