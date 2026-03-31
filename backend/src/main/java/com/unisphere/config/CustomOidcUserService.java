package com.unisphere.config;

import com.unisphere.entity.Role;
import com.unisphere.entity.User;
import com.unisphere.service.UserService;
import java.util.Collections;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.oauth2.client.oidc.userinfo.OidcUserRequest;
import org.springframework.security.oauth2.client.oidc.userinfo.OidcUserService;
import org.springframework.security.oauth2.core.oidc.user.DefaultOidcUser;
import org.springframework.security.oauth2.core.oidc.user.OidcUser;
import org.springframework.stereotype.Service;

@Service
public class CustomOidcUserService extends OidcUserService {

    private final UserService userService;

    public CustomOidcUserService(UserService userService) {
        this.userService = userService;
    }

    @Override
    public OidcUser loadUser(OidcUserRequest userRequest) {
        OidcUser oidcUser = super.loadUser(userRequest);
        String email = oidcUser.getEmail();
        String name = oidcUser.getFullName();
        String picture = oidcUser.getPicture();
        String googleId = oidcUser.getSubject();

        User saved = userService.upsertOAuthUser(googleId, name, email, picture, null, null);
        Role role = saved.getRole();
        return new DefaultOidcUser(
            Collections.singletonList(new SimpleGrantedAuthority("ROLE_" + role.name())),
            oidcUser.getIdToken(),
            oidcUser.getUserInfo()
        );
    }
}
