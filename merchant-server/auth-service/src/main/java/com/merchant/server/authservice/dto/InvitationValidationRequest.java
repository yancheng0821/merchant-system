package com.merchant.server.authservice.dto;

import lombok.Data;
import jakarta.validation.constraints.NotBlank;

@Data
public class InvitationValidationRequest {
    
    @NotBlank(message = "{invitation.code.required}")
    private String invitationCode;
}