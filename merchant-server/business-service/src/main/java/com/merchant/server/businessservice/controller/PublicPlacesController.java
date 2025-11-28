package com.merchant.server.businessservice.controller;

import com.merchant.server.businessservice.service.GooglePlacesService;
import com.merchant.server.businessservice.service.GooglePlacesService.AutocompleteResult;
import com.merchant.server.businessservice.service.GooglePlacesService.PlaceDetails;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

/**
 * 公开的 Google Places API 控制器
 * 用于商户注册等不需要认证的场景
 *
 * 注意：来源限制在 Gateway 层进行验证
 */
@Slf4j
@RestController
@RequestMapping("/api/public/places")
@RequiredArgsConstructor
public class PublicPlacesController {

    private final GooglePlacesService googlePlacesService;

    /**
     * 地址自动补全
     * @param input 用户输入的地址文本
     * @param country 国家代码（可选，如 "ca", "us"）
     * @return 自动补全建议列表
     */
    @GetMapping("/autocomplete")
    public ResponseEntity<Map<String, Object>> autocomplete(
            @RequestParam String input,
            @RequestParam(required = false) String country) {

        log.debug("Places autocomplete request: input={}, country={}", input, country);

        Map<String, Object> response = new HashMap<>();

        try {
            List<AutocompleteResult> results = googlePlacesService.autocomplete(input, country);
            response.put("success", true);
            response.put("predictions", results);
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            log.error("Autocomplete error: {}", e.getMessage(), e);
            response.put("success", false);
            response.put("error", "AUTOCOMPLETE_ERROR");
            return ResponseEntity.ok(response);
        }
    }

    /**
     * 获取地点详情
     * @param placeId Google Place ID
     * @return 地点详情，包含解析后的地址组件
     */
    @GetMapping("/details")
    public ResponseEntity<Map<String, Object>> getPlaceDetails(@RequestParam String placeId) {

        log.debug("Place details request: placeId={}", placeId);

        Map<String, Object> response = new HashMap<>();

        try {
            PlaceDetails details = googlePlacesService.getPlaceDetails(placeId);

            if (details != null) {
                response.put("success", true);
                response.put("result", details);
            } else {
                response.put("success", false);
                response.put("error", "PLACE_NOT_FOUND");
            }

            return ResponseEntity.ok(response);
        } catch (Exception e) {
            log.error("Place details error: {}", e.getMessage(), e);
            response.put("success", false);
            response.put("error", "DETAILS_ERROR");
            return ResponseEntity.ok(response);
        }
    }
}
