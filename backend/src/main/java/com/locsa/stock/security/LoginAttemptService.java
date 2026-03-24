package com.locsa.stock.security;

import org.springframework.stereotype.Service;

import java.util.concurrent.ConcurrentHashMap;

/**
 * In-memory brute-force protection.
 * Blocks a username for 15 minutes after 5 consecutive failed logins.
 */
@Service
public class LoginAttemptService {

    private static final int  MAX_ATTEMPTS    = 5;
    private static final long LOCK_DURATION_MS = 15 * 60 * 1000L; // 15 minutes

    private final ConcurrentHashMap<String, Integer> attempts = new ConcurrentHashMap<>();
    private final ConcurrentHashMap<String, Long>    lockTime = new ConcurrentHashMap<>();

    public void loginFailed(String username) {
        int count = attempts.merge(username, 1, Integer::sum);
        if (count >= MAX_ATTEMPTS) {
            lockTime.put(username, System.currentTimeMillis());
        }
    }

    public void loginSucceeded(String username) {
        attempts.remove(username);
        lockTime.remove(username);
    }

    public boolean isBlocked(String username) {
        Long lockedAt = lockTime.get(username);
        if (lockedAt == null) return false;
        if (System.currentTimeMillis() - lockedAt > LOCK_DURATION_MS) {
            attempts.remove(username);
            lockTime.remove(username);
            return false;
        }
        return true;
    }

    public long remainingLockSeconds(String username) {
        Long lockedAt = lockTime.get(username);
        if (lockedAt == null) return 0;
        long elapsed = System.currentTimeMillis() - lockedAt;
        return Math.max(0, (LOCK_DURATION_MS - elapsed) / 1000);
    }
}
