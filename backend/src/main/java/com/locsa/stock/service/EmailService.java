package com.locsa.stock.service;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;

import jakarta.mail.internet.MimeMessage;

@Slf4j
@Service
@RequiredArgsConstructor
public class EmailService {

    private final JavaMailSender mailSender;

    @Value("${app.mail.from}")
    private String from;

    @Value("${app.frontend.url}")
    private String frontendUrl;

    @Async
    public void sendWelcomeEmail(String to, String username, String password) {
        try {
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");
            helper.setFrom(from, "LOCSA SARL");
            helper.setTo(to);
            helper.setSubject("Bienvenue sur LOCSA — Vos identifiants de connexion");
            helper.setText(buildWelcomeHtml(to, username, password), true);
            mailSender.send(message);
            log.info("Welcome email sent to {}", to);
        } catch (Exception e) {
            log.error("Failed to send welcome email to {}: {}", to, e.getMessage());
        }
    }

    @Async
    public void sendPasswordResetEmail(String to, String token) {
        try {
            String resetLink = frontendUrl + "/reset-password?token=" + token;
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");
            helper.setFrom(from, "LOCSA SARL");
            helper.setTo(to);
            helper.setSubject("LOCSA — Réinitialisation de mot de passe");
            helper.setText(buildResetHtml(resetLink), true);
            mailSender.send(message);
            log.info("Password reset email sent to {}", to);
        } catch (Exception e) {
            log.error("Failed to send reset email to {}: {}", to, e.getMessage());
        }
    }

    private String buildWelcomeHtml(String email, String username, String password) {
        return """
            <div style="font-family:Arial,sans-serif;max-width:520px;margin:auto;background:#f9fafb;border-radius:12px;overflow:hidden;border:1px solid #e5e7eb">
              <div style="background:#1d4ed8;padding:28px 32px">
                <h1 style="color:#fff;margin:0;font-size:22px">LOCSA SARL — Gestion de Stock</h1>
              </div>
              <div style="padding:32px">
                <p style="color:#374151;font-size:15px">Bonjour <strong>%s</strong>,</p>
                <p style="color:#374151;font-size:15px">Votre compte a été créé. Voici vos identifiants de connexion :</p>
                <div style="background:#eff6ff;border:1px solid #bfdbfe;border-radius:8px;padding:20px;margin:24px 0">
                  <p style="margin:0 0 8px;color:#1e40af;font-size:14px"><strong>Email (identifiant) :</strong> %s</p>
                  <p style="margin:0;color:#1e40af;font-size:14px"><strong>Mot de passe :</strong> %s</p>
                </div>
                <div style="text-align:center;margin:24px 0">
                  <a href="%s" style="background:#1d4ed8;color:#fff;padding:12px 28px;border-radius:8px;text-decoration:none;font-size:15px;font-weight:bold">
                    Accéder à la plateforme
                  </a>
                </div>
                <p style="color:#6b7280;font-size:13px">Pour des raisons de sécurité, changez votre mot de passe dès votre première connexion.</p>
                <p style="color:#9ca3af;font-size:12px;margin-top:32px;border-top:1px solid #e5e7eb;padding-top:16px">
                  LOCSA SARL · Énergie · Service · Telecom
                </p>
              </div>
            </div>
            """.formatted(username, email, password, frontendUrl);
    }

    private String buildResetHtml(String resetLink) {
        return """
            <div style="font-family:Arial,sans-serif;max-width:520px;margin:auto;background:#f9fafb;border-radius:12px;overflow:hidden;border:1px solid #e5e7eb">
              <div style="background:#1d4ed8;padding:28px 32px">
                <h1 style="color:#fff;margin:0;font-size:22px">LOCSA SARL — Gestion de Stock</h1>
              </div>
              <div style="padding:32px">
                <p style="color:#374151;font-size:15px">Vous avez demandé une réinitialisation de mot de passe.</p>
                <p style="color:#374151;font-size:15px">Cliquez sur le bouton ci-dessous. Ce lien est valable <strong>1 heure</strong>.</p>
                <div style="text-align:center;margin:32px 0">
                  <a href="%s" style="background:#1d4ed8;color:#fff;padding:14px 32px;border-radius:8px;text-decoration:none;font-size:15px;font-weight:bold">
                    Réinitialiser mon mot de passe
                  </a>
                </div>
                <p style="color:#6b7280;font-size:13px">Si vous n'avez pas fait cette demande, ignorez cet email.</p>
                <p style="color:#9ca3af;font-size:12px;margin-top:32px;border-top:1px solid #e5e7eb;padding-top:16px">
                  LOCSA SARL · Énergie · Service · Telecom
                </p>
              </div>
            </div>
            """.formatted(resetLink);
    }
}
