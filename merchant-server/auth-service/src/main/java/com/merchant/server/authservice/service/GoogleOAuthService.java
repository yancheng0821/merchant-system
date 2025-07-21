package com.merchant.server.authservice.service;

import com.google.api.client.googleapis.auth.oauth2.GoogleIdToken;
import com.google.api.client.googleapis.auth.oauth2.GoogleIdTokenVerifier;
import com.google.api.client.http.javanet.NetHttpTransport;
import com.google.api.client.json.gson.GsonFactory;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.util.Collections;

@Service
public class GoogleOAuthService {
    
    private static final Logger logger = LoggerFactory.getLogger(GoogleOAuthService.class);
    
    @Value("${google.oauth2.client-id}")
    private String googleClientId;
    
    private GoogleIdTokenVerifier verifier;
    
    /**
     * 验证Google ID Token
     */
    public GoogleUserInfo verifyGoogleToken(String idToken) {
        try {
            if (verifier == null) {
                verifier = new GoogleIdTokenVerifier.Builder(
                    new NetHttpTransport(), 
                    GsonFactory.getDefaultInstance())
                    .setAudience(Collections.singletonList(googleClientId))
                    .build();
            }
            
            GoogleIdToken token = verifier.verify(idToken);
            if (token != null) {
                GoogleIdToken.Payload payload = token.getPayload();
                
                GoogleUserInfo userInfo = new GoogleUserInfo();
                userInfo.setGoogleId(payload.getSubject());
                userInfo.setEmail(payload.getEmail());
                userInfo.setName((String) payload.get("name"));
                userInfo.setGivenName((String) payload.get("given_name"));
                userInfo.setFamilyName((String) payload.get("family_name"));
                userInfo.setPicture((String) payload.get("picture"));
                userInfo.setEmailVerified(payload.getEmailVerified());
                
                logger.info("Google token验证成功 - 用户: {}, 邮箱: {}", userInfo.getName(), userInfo.getEmail());
                return userInfo;
            } else {
                logger.warn("Google token验证失败 - 无效token");
                return null;
            }
        } catch (Exception e) {
            logger.error("Google token验证异常: {}", e.getMessage());
            return null;
        }
    }
    
    /**
     * Google用户信息
     */
    public static class GoogleUserInfo {
        private String googleId;
        private String email;
        private String name;
        private String givenName;
        private String familyName;
        private String picture;
        private Boolean emailVerified;
        
        // Getters and Setters
        public String getGoogleId() {
            return googleId;
        }
        
        public void setGoogleId(String googleId) {
            this.googleId = googleId;
        }
        
        public String getEmail() {
            return email;
        }
        
        public void setEmail(String email) {
            this.email = email;
        }
        
        public String getName() {
            return name;
        }
        
        public void setName(String name) {
            this.name = name;
        }
        
        public String getGivenName() {
            return givenName;
        }
        
        public void setGivenName(String givenName) {
            this.givenName = givenName;
        }
        
        public String getFamilyName() {
            return familyName;
        }
        
        public void setFamilyName(String familyName) {
            this.familyName = familyName;
        }
        
        public String getPicture() {
            return picture;
        }
        
        public void setPicture(String picture) {
            this.picture = picture;
        }
        
        public Boolean getEmailVerified() {
            return emailVerified;
        }
        
        public void setEmailVerified(Boolean emailVerified) {
            this.emailVerified = emailVerified;
        }
        
        @Override
        public String toString() {
            return "GoogleUserInfo{" +
                    "googleId='" + googleId + '\'' +
                    ", email='" + email + '\'' +
                    ", name='" + name + '\'' +
                    ", givenName='" + givenName + '\'' +
                    ", familyName='" + familyName + '\'' +
                    ", picture='" + picture + '\'' +
                    ", emailVerified=" + emailVerified +
                    '}';
        }
    }
}