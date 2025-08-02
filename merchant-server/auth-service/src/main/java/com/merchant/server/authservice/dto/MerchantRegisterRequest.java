package com.merchant.server.authservice.dto;

import lombok.Data;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.Size;

import java.util.List;

@Data
public class MerchantRegisterRequest {
    
    // 管理员用户信息
    @NotBlank(message = "{user.username.required}")
    @Size(min = 3, max = 50, message = "{user.username.length}")
    private String username;
    
    @NotBlank(message = "{user.password.required}")
    @Size(min = 6, max = 100, message = "{user.password.length}")
    private String password;
    
    @NotBlank(message = "{user.password.mismatch}")
    private String confirmPassword;
    
    @NotBlank(message = "{user.realname.required}")
    @Size(max = 100, message = "{user.realname.length}")
    private String realName;
    
    @Email(message = "{validation.email.invalid}")
    @NotBlank(message = "{user.email.required}")
    private String email;
    
    @Size(max = 20, message = "{user.phone.length}")
    private String phone;
    
    // 商户信息
    @NotBlank(message = "{merchant.name.required}")
    @Size(max = 200, message = "{merchant.name.length}")
    private String merchantName;
    
    @NotBlank(message = "{merchant.category.required}")
    private String businessCategory;
    
    private String businessLicense;
    
    @NotBlank(message = "{merchant.contact.person.required}")
    private String contactPerson;
    
    @NotBlank(message = "{merchant.contact.phone.required}")
    private String contactPhone;
    
    @Email(message = "{validation.email.invalid}")
    private String contactEmail;
    
    private String address;
    private String province;
    private String city;
    private String postCode;
    
    @NotBlank(message = "{merchant.timezone.required}")
    private String timezone;
    
    // 资源类型配置
    @NotEmpty(message = "{merchant.resource.types.required}")
    private List<String> resourceTypes; // ["STAFF", "ROOM"]
}