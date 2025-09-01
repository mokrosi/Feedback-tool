package com.training.feedbacktool.service;

import org.springframework.stereotype.Service;
import java.util.Set;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.Executors;
import java.util.concurrent.ScheduledExecutorService;
import java.util.concurrent.TimeUnit;
import java.util.Date;
import java.util.Iterator;

/**
 * Service to manage blacklisted JWT tokens for proper logout functionality.
 * This is an in-memory implementation. For production, consider using Redis or
 * database.
 */
@Service
public class TokenBlacklistService {

    // Store blacklisted tokens with their expiration time
    private final Set<BlacklistedToken> blacklistedTokens = ConcurrentHashMap.newKeySet();
    private final ScheduledExecutorService cleanupExecutor = Executors.newScheduledThreadPool(1);

    public TokenBlacklistService() {
        // Clean up expired tokens every hour
        cleanupExecutor.scheduleAtFixedRate(this::cleanupExpiredTokens, 1, 1, TimeUnit.HOURS);
    }

    /**
     * Add a token to the blacklist
     */
    public void blacklistToken(String token, Date expirationDate) {
        blacklistedTokens.add(new BlacklistedToken(token, expirationDate));
    }

    /**
     * Check if a token is blacklisted
     */
    public boolean isTokenBlacklisted(String token) {
        return blacklistedTokens.stream()
                .anyMatch(blacklistedToken -> blacklistedToken.token.equals(token));
    }

    /**
     * Remove expired tokens from the blacklist to prevent memory leaks
     */
    private void cleanupExpiredTokens() {
        Date now = new Date();
        Iterator<BlacklistedToken> iterator = blacklistedTokens.iterator();
        while (iterator.hasNext()) {
            BlacklistedToken blacklistedToken = iterator.next();
            if (blacklistedToken.expirationDate.before(now)) {
                iterator.remove();
            }
        }
    }

    /**
     * Inner class to store blacklisted token with its expiration
     */
    private static class BlacklistedToken {
        private final String token;
        private final Date expirationDate;

        public BlacklistedToken(String token, Date expirationDate) {
            this.token = token;
            this.expirationDate = expirationDate;
        }

        @Override
        public boolean equals(Object obj) {
            if (this == obj)
                return true;
            if (obj == null || getClass() != obj.getClass())
                return false;
            BlacklistedToken that = (BlacklistedToken) obj;
            return token.equals(that.token);
        }

        @Override
        public int hashCode() {
            return token.hashCode();
        }
    }
}