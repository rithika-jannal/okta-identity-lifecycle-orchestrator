package com.company.identity.workstream4_dashboard_integration.controller;

import com.company.identity.common.dto.MoverRequest;
import com.company.identity.common.model.User;
import com.company.identity.workstream1_okta_lifecycle.lifecycle.MoverService;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("")
public class MoverController {
    private final MoverService moverService;

    public MoverController(MoverService moverService) {
        this.moverService = moverService;
    }

    @PutMapping("/lifecycle/mover/{id}")
    public User moveUser(@PathVariable String id, @RequestBody MoverRequest request) throws Exception {
        return moverService.mover(id, request);
    }
}