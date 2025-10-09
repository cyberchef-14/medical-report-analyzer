import { Heart, Stethoscope, Shield, Phone, Mail } from "lucide-react";

const Footer = () => {
  return (
    <footer className="bg-card border-t border-border mt-16">
      {/* Doctor's Advice Section */}
      <div className="container mx-auto px-4 py-12">
        <div className="grid md:grid-cols-2 gap-8 mb-8">
          <div className="space-y-4">
            <div className="flex items-center gap-3 mb-4">
              <Stethoscope className="w-8 h-8 text-primary" />
              <h3 className="text-xl font-semibold">Doctor's Advice</h3>
            </div>
            <div className="space-y-3 text-sm text-muted-foreground">
              <div className="flex gap-2">
                <Heart className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
                <p>Always consult with your healthcare provider before making any medical decisions</p>
              </div>
              <div className="flex gap-2">
                <Shield className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
                <p>Keep your medical reports organized and easily accessible for emergencies</p>
              </div>
              <div className="flex gap-2">
                <Stethoscope className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
                <p>Regular health checkups can help detect issues early and improve outcomes</p>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <h3 className="text-xl font-semibold mb-4">Important Disclaimer</h3>
            <p className="text-sm text-muted-foreground leading-relaxed">
              This tool provides AI-generated summaries for informational purposes only. 
              It is not a substitute for professional medical advice, diagnosis, or treatment. 
              Always seek the advice of your physician or other qualified health provider 
              with any questions you may have regarding a medical condition.
            </p>
          </div>
        </div>
      </div>

      {/* Bottom Bar */}
      <div className="border-t border-border">
        <div className="container mx-auto px-4 py-6">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4 text-sm text-muted-foreground">
            <div className="flex items-center gap-2">
              <Stethoscope className="w-5 h-5 text-primary" />
              <span>Medical Report Summarizer © 2025</span>
            </div>
            <div className="flex items-center gap-6">
              <div className="flex items-center gap-2">
                <Phone className="w-4 h-4" />
                <span>Emergency: 911</span>
              </div>
              <div className="flex items-center gap-2">
                <Mail className="w-4 h-4" />
                <span>support@medreport.com</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
