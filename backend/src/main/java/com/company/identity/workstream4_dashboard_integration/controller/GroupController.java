package com.company.identity.workstream4_dashboard_integration.controller;

import com.company.identity.common.model.Group;
import com.company.identity.common.model.User;
import com.company.identity.workstream1_okta_lifecycle.okta.OktaGroupClient;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("")
public class GroupController {
    private final OktaGroupClient groupClient;

    public GroupController(OktaGroupClient groupClient) {
        this.groupClient = groupClient;
    }

    @GetMapping("/groups")
    public List<Group> getGroups() throws Exception {
        return groupClient.getGroups();
    }

    @GetMapping("/groups/{id}/members")
    public List<User> getGroupMembers(@PathVariable String id) throws Exception {
        return groupClient.getGroupMembers(id);
    }
}