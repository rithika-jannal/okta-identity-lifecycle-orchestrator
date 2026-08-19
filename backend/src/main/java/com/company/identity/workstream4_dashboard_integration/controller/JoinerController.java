package com.company.identity.workstream4_dashboard_integration.controller;

import com.company.identity.common.dto.JoinerRequest;
import com.company.identity.common.model.User;
import com.company.identity.workstream1_okta_lifecycle.lifecycle.JoinerService;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("")
public class JoinerController {
    private final JoinerService joinerService;

    public JoinerController(JoinerService joinerService) {
        this.joinerService = joinerService;
    }

    @PostMapping("/lifecycle/joiner")
    public User action(@RequestBody JoinerRequest request) throws Exception {
        return joinerService.joiner(request);
    }
}
