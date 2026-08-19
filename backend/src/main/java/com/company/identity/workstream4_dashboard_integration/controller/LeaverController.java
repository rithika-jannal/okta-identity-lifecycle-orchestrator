package com.company.identity.workstream4_dashboard_integration.controller;

import com.company.identity.common.dto.LeaverRequest;
import com.company.identity.common.model.User;
import com.company.identity.workstream1_okta_lifecycle.lifecycle.LeaverService;
import com.company.identity.workstream1_okta_lifecycle.okta.OktaUserClient;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("")
public class LeaverController {
    private final LeaverService leaverService;
    private final OktaUserClient userClient;

    public LeaverController(LeaverService leaverService, OktaUserClient userClient) {
        this.leaverService = leaverService;
        this.userClient = userClient;
    }

    @PostMapping("/lifecycle/leaver/{id}")
    public User deactivateUser(@PathVariable String id, @RequestBody(required = false) LeaverRequest request) throws Exception {
        leaverService.leaver(id, request);
        return userClient.getUser(id);
    }
}