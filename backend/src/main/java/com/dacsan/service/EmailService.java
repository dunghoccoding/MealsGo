package com.dacsan.service;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;

import jakarta.mail.MessagingException;
import jakarta.mail.internet.MimeMessage;

@Service
@RequiredArgsConstructor
@Slf4j
public class EmailService {

    private final JavaMailSender mailSender;

    @Async
    public void sendOtpEmail(String toEmail, String otp) {
        try {
            MimeMessage mimeMessage = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(mimeMessage, true, "UTF-8");

            helper.setFrom("mealsgoteam@gmail.com", "MealsGo Team");
            helper.setTo(toEmail);
            helper.setSubject("🔐 Mã OTP Đặt Lại Mật Khẩu - MealsGo");

            String htmlContent = """
                    <!DOCTYPE html>
                    <html lang="vi">
                    <head>
                      <meta charset="UTF-8">
                      <meta name="viewport" content="width=device-width, initial-scale=1.0">
                    </head>
                    <body style="margin:0;padding:0;background-color:#0d1f17;font-family:'Segoe UI',Arial,sans-serif;">
                      <div style="max-width:560px;margin:40px auto;background:linear-gradient(145deg,#0f2a1e,#0a1a12);border-radius:24px;overflow:hidden;border:1px solid rgba(52,211,153,0.15);box-shadow:0 25px 50px rgba(0,0,0,0.5);">
                        
                        <!-- Header -->
                        <div style="background:linear-gradient(135deg,#065f46,#047857);padding:40px 40px 30px;text-align:center;">
                          <div style="display:inline-block;background:rgba(255,255,255,0.1);border-radius:16px;padding:12px 20px;margin-bottom:16px;">
                            <span style="font-size:32px;">🍜</span>
                          </div>
                          <h1 style="color:#fff;margin:0;font-size:28px;font-weight:800;letter-spacing:-0.5px;">MealsGo</h1>
                          <p style="color:rgba(255,255,255,0.7);margin:8px 0 0;font-size:14px;">Tinh hoa ẩm thực Việt Nam</p>
                        </div>

                        <!-- Body -->
                        <div style="padding:40px;">
                          <h2 style="color:#ecfdf5;font-size:22px;font-weight:700;margin:0 0 12px;">Đặt lại mật khẩu</h2>
                          <p style="color:rgba(209,250,229,0.7);font-size:15px;line-height:1.6;margin:0 0 32px;">
                            Chúng tôi nhận được yêu cầu đặt lại mật khẩu cho tài khoản của bạn. Sử dụng mã OTP bên dưới để tiếp tục.
                          </p>

                          <!-- OTP Box -->
                          <div style="background:linear-gradient(135deg,rgba(52,211,153,0.1),rgba(16,185,129,0.05));border:1px solid rgba(52,211,153,0.3);border-radius:16px;padding:32px;text-align:center;margin-bottom:32px;">
                            <p style="color:rgba(209,250,229,0.5);font-size:12px;font-weight:600;letter-spacing:3px;text-transform:uppercase;margin:0 0 16px;">Mã xác thực OTP</p>
                            <div style="font-size:48px;font-weight:900;color:#34d399;letter-spacing:12px;font-family:'Courier New',monospace;">%s</div>
                            <p style="color:rgba(209,250,229,0.4);font-size:13px;margin:16px 0 0;">⏱ Mã có hiệu lực trong <strong style="color:#6ee7b7;">5 phút</strong></p>
                          </div>

                          <div style="background:rgba(239,68,68,0.08);border:1px solid rgba(239,68,68,0.2);border-radius:12px;padding:16px;margin-bottom:32px;">
                            <p style="color:rgba(252,165,165,0.8);font-size:13px;margin:0;line-height:1.5;">
                              ⚠️ <strong>Lưu ý bảo mật:</strong> Không chia sẻ mã này với bất kỳ ai. Đội ngũ MealsGo sẽ không bao giờ yêu cầu mã OTP của bạn.
                            </p>
                          </div>

                          <p style="color:rgba(209,250,229,0.4);font-size:13px;line-height:1.6;margin:0;">
                            Nếu bạn không yêu cầu đặt lại mật khẩu, hãy bỏ qua email này. Tài khoản của bạn vẫn an toàn.
                          </p>
                        </div>

                        <!-- Footer -->
                        <div style="border-top:1px solid rgba(52,211,153,0.1);padding:24px 40px;text-align:center;">
                          <p style="color:rgba(209,250,229,0.3);font-size:12px;margin:0;">
                            © 2024 MealsGo Team · mealsgoteam@gmail.com
                          </p>
                        </div>
                      </div>
                    </body>
                    </html>
                    """.formatted(otp);

            helper.setText(htmlContent, true);
            mailSender.send(mimeMessage);
            log.info("OTP email sent successfully to: {}", toEmail);

        } catch (MessagingException e) {
            log.error("Failed to send OTP email to {}: {}", toEmail, e.getMessage());
            throw new RuntimeException("Không thể gửi email. Vui lòng thử lại sau.");
        } catch (Exception e) {
            log.error("Unexpected error sending email to {}: {}", toEmail, e.getMessage());
            throw new RuntimeException("Lỗi gửi email: " + e.getMessage());
        }
    }
}
