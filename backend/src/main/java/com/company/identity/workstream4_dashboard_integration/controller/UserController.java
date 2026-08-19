package com.company.identity.workstream4_dashboard_integration.controller;

import com.company.identity.common.model.Group;
import com.company.identity.common.model.User;
import com.company.identity.workstream1_okta_lifecycle.okta.OktaGroupClient;
import com.company.identity.workstream1_okta_lifecycle.okta.OktaUserClient;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("")
public class UserController {
    private final OktaUserClient userClient;
    private final OktaGroupClient groupClient;

    public UserController(OktaUserClient userClient, OktaGroupClient groupClient) {
        this.userClient = userClient;
        this.groupClient = groupClient;
    }

    @GetMapping("/users")
    public List<User> getUsers() throws Exception {
        return userClient.getUsers();
    }

    @GetMapping("/users/{id}")
    public User getUser(@PathVariable String id) throws Exception {
        return userClient.getUser(id);
    }

    @GetMapping("/users/{id}/groups")
    public List<Group> getUserGroups(@PathVariable String id) throws Exception {
        return groupClient.getUserGroups(id);
    }
}