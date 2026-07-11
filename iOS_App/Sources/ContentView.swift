import SwiftUI
#if os(macOS)
import AppKit
typealias PlatformImage = NSImage
#else
import UIKit
typealias PlatformImage = UIImage
#endif

// MARK: - Models
struct FallacyItem: Codable, Identifiable, Hashable {
    var id: String { quote + errorName }
    let quote: String
    let errorName: String
    let explanation: String
}

struct HistoryItem: Codable, Identifiable, Hashable {
    let id: UUID
    let timestamp: Date
    let text: String
    let fallacies: [FallacyItem]
    let lang: String
}

struct AnalysisRequest: Codable {
    let text: String
    let lang: String
}

struct AnalysisResponse: Codable {
    let analysis: [FallacyItem]
}

struct ErrorResponse: Codable {
    let error: String
}

// MARK: - Strings Localization
struct AppStrings {
    let id: String
    let appTitle: String
    let selectLang: String
    let analyze: String
    let history: String
    let spiritual: String
    let material: String
    let back: String
    let analyzePlaceholder: String
    let analyzeBtn: String
    let analyzing: String
    let noErrors: String
    let exportPdf: String
    let historyEmpty: String
    let spiritualDesc: String
    let send: String
    let materialDesc: String
    let donate: String
    let delete: String
    let errorRequired: String
    let submittedText: String
    let logicalAnalysis: String
    let backToMenu: String
    let emailSubject: String
    let emailBody: String
}

let faStrings = AppStrings(
    id: "fa",
    appTitle: "منطک",
    selectLang: "لطفاً زبان خود را انتخاب کنید",
    analyze: "بررسی منطق",
    history: "بایگانی و ارزیابی‌ها",
    spiritual: "ارسال بازخورد",
    material: "حمایت مادی",
    back: "بازگشت",
    analyzePlaceholder: "متن خود را برای بررسی عمیق منطقی عقلانی در اینجا وارد کنید...",
    analyzeBtn: "بررسی متن",
    analyzing: "در حال تحلیل (منطق‌سنجی)...",
    noErrors: "عالی! خطای منطقی واضحی در این متن شناسایی نشد.",
    exportPdf: "اشتراک‌گذاری کارنامه",
    historyEmpty: "بایگانی بررسی‌های شما خالی است.",
    spiritualDesc: "دیدگاه‌ها و نظرات خود را برای ما بفرستید تا اثر معنوی کارتان را ببینیم.",
    send: "ارسال ایمیل",
    materialDesc: "در صورت تمایل می‌توانید به صورت مستقیم از طریق پی‌پال از توسعه این برنامه حمایت کنید.",
    donate: "پرداخت / حمایت مالی (PayPal)",
    delete: "حذف",
    errorRequired: "وارد کردن متن الزامی است.",
    submittedText: "متن ارسالی کاربر:",
    logicalAnalysis: "کارنامه منطق‌سنجی",
    backToMenu: "بازگشت به منو",
    emailSubject: "بازخورد در مورد اپلیکیشن منطک",
    emailBody: "سلام،\nدرخواست بازخورد در مورد اپلیکیشن منطک دارم..."
)

let enStrings = AppStrings(
    id: "en",
    appTitle: "Mantak",
    selectLang: "Please select your language",
    analyze: "Analyze Logic",
    history: "Archives & Records",
    spiritual: "Direct Feedback",
    material: "Financial Support",
    back: "Back",
    analyzePlaceholder: "Enter your text here for deep logical reasoning analysis...",
    analyzeBtn: "Analyze Text",
    analyzing: "Analyzing logic...",
    noErrors: "Excellent! No obvious logical fallacies were detected in this text.",
    exportPdf: "Share Report Card",
    historyEmpty: "Your analysis history is empty.",
    spiritualDesc: "Send us your thoughts and let your feedback have a spiritual impact.",
    send: "Send Email",
    materialDesc: "If you wish, you can support the development of this app directly via PayPal.",
    donate: "Donate (PayPal)",
    delete: "Delete",
    errorRequired: "Text is required.",
    submittedText: "Submitted Text:",
    logicalAnalysis: "Logical Analysis",
    backToMenu: "Back to Menu",
    emailSubject: "Feedback on Mantak App",
    emailBody: "Hi,\nI would like to share my feedback on Mantak app..."
)

// MARK: - Theme Modifier
struct BrutalistBox: ViewModifier {
    let backgroundColor: Color
    let shadowColor: Color
    
    func body(content: Content) -> some View {
        content
            .background(backgroundColor)
            .border(Color(red: 0.1, green: 0.1, blue: 0.1), width: 3)
            .shadow(color: shadowColor, radius: 0, x: 6, y: 6)
    }
}

extension View {
    func brutalistStyle(bg: Color = .white, shadow: Color = Color(red: 0.1, green: 0.1, blue: 0.1)) -> some View {
        self.modifier(BrutalistBox(backgroundColor: bg, shadowColor: shadow))
    }
}

// MARK: - State Store
class AppHistoryStore: ObservableObject {
    @Published var items: [HistoryItem] = [] {
        didSet { save() }
    }
    
    init() { load() }
    
    private func load() {
        if let data = UserDefaults.standard.data(forKey: "mantak_history"),
           let decoded = try? JSONDecoder().decode([HistoryItem].self, from: data) {
            self.items = decoded
        }
    }
    
    func save() {
        if let encoded = try? JSONEncoder().encode(items) {
            UserDefaults.standard.set(encoded, forKey: "mantak_history")
        }
    }
    
    func add(text: String, fallacies: [FallacyItem], lang: String) {
        let newItem = HistoryItem(id: UUID(), timestamp: Date(), text: text, fallacies: fallacies, lang: lang)
        items.insert(newItem, at: 0)
    }
    
    func delete(at offsets: IndexSet) {
        items.remove(atOffsets: offsets)
    }
}

// MARK: - Circular Administrative Stamp (Seal)
struct SealView: View {
    let date: Date
    let isFa: Bool
    
    var body: some View {
        VStack(spacing: 3) {
            Text(isFa ? "مهر ارزیابی عقلانی" : "RATIONAL GRADE")
                .font(.system(size: 8, weight: .bold, design: .monospaced))
                .foregroundColor(Color.red.opacity(0.85))
            
            Text(isFa ? "منـطک" : "MANTAK")
                .font(.system(size: 20, weight: .black, design: .serif))
                .foregroundColor(Color.red.opacity(0.85))
                .padding(.vertical, 1)
            
            VStack(spacing: 1) {
                Text(formatDate(date))
                Text(formatTime(date))
            }
            .font(.system(size: 8, weight: .bold, design: .monospaced))
            .foregroundColor(Color.red.opacity(0.85))
        }
        .padding(14)
        .background(
            Circle()
                .stroke(Color.red.opacity(0.85), lineWidth: 3)
                .overlay(
                    Circle()
                        .stroke(Color.red.opacity(0.85), lineWidth: 1)
                        .padding(3)
                )
        )
        .rotationEffect(.degrees(-12))
    }
    
    private func formatDate(_ d: Date) -> String {
        let formatter = DateFormatter()
        formatter.locale = Locale(identifier: isFa ? "fa_IR" : "en_US")
        formatter.dateFormat = "yyyy/MM/dd"
        return toPersianDigits(formatter.string(from: d))
    }
    
    private func formatTime(_ d: Date) -> String {
        let formatter = DateFormatter()
        formatter.locale = Locale(identifier: isFa ? "fa_IR" : "en_US")
        formatter.dateFormat = "HH:mm"
        return toPersianDigits(formatter.string(from: d))
    }
    
    private func toPersianDigits(_ str: String) -> String {
        guard isFa else { return str }
        return str.replaceEnglishWithPersianDigits()
    }
}

extension String {
    func replaceEnglishWithPersianDigits() -> String {
        var str = self
        let replacements = [
            "0": "۰", "1": "۱", "2": "۲", "3": "۳", "4": "۴",
            "5": "۵", "6": "۶", "7": "۷", "8": "۸", "9": "۹"
        ]
        for (eng, per) in replacements {
            str = str.replacingOccurrences(of: eng, with: per)
        }
        return str
    }
}

// MARK: - Paper View Component
struct ExamPaperView: View {
    let text: String
    let fallacies: [FallacyItem]
    let date: Date
    let isFa: Bool
    
    var body: some View {
        VStack(alignment: .leading, spacing: 18) {
            // Header Title
            HStack {
                Spacer()
                Text(isFa ? "کارنامه منطق‌سنجی منـطک" : "MANTAK Evaluation Slip")
                    .font(.system(.title, design: .serif))
                    .fontWeight(.bold)
                    .foregroundColor(Color(red: 0.1, green: 0.2, blue: 0.5))
                    .multilineTextAlignment(.center)
                Spacer()
            }
            .padding(.bottom, 12)
            
            // Raw text box
            VStack(alignment: .leading, spacing: 6) {
                Text(isFa ? "متن ارسالی جهت کالبدشکافی عقلانی:" : "Submitted Text:")
                    .font(.system(size: 14, weight: .black, design: .serif))
                    .foregroundColor(Color(red: 0.15, green: 0.2, blue: 0.4))
                    .underline()
                
                Text(text)
                    .font(.system(.body, design: .serif))
                    .foregroundColor(Color.blue)
                    .italic()
                    .lineSpacing(4)
                    .frame(maxWidth: .infinity, alignment: isFa ? .trailing : .leading)
            }
            .padding(12)
            .background(Color.blue.opacity(0.04))
            .border(Color.blue.opacity(0.2), width: 1)
            
            Divider()
                .background(Color.red.opacity(0.5))
            
            // Analysis Items
            if fallacies.isEmpty {
                VStack(spacing: 12) {
                    Text(isFa ? "حکم ارزیاب:" : "Evaluator Verdict:")
                        .font(.system(size: 16, weight: .bold))
                        .foregroundColor(Color.red)
                    
                    Text(isFa ? "💯 عالی! هیچ مغالطه یا انحراف منطقی آشکاری در این متن یافت نشد. شیوه استدلال عقلانی است." : "💯 Excellent! No apparent logical fallacies or rational inconsistencies identified.")
                        .font(.system(.title3, design: .serif))
                        .foregroundColor(Color(red: 0.8, green: 0.1, blue: 0.1))
                        .multilineTextAlignment(.center)
                        .lineSpacing(6)
                        .padding()
                }
                .frame(maxWidth: .infinity)
                .padding(.vertical, 20)
            } else {
                ForEach(fallacies, id: \.self) { fallacy in
                    VStack(alignment: .leading, spacing: 10) {
                        // Flawed phrase block
                        HStack {
                            Text(isFa ? "خطای تکیه‌گاه:" : "Flawed Context:")
                                .font(.system(size: 12, weight: .bold))
                                .foregroundColor(Color.blue.opacity(0.6))
                            Spacer()
                        }
                        
                        Text("\"\(fallacies.count > 0 ? fallacy.quote : "")\"")
                            .font(.system(size: 17, weight: .medium, design: .serif))
                            .foregroundColor(Color.blue)
                            .padding(.horizontal, 10)
                            .padding(.vertical, 6)
                            .background(Color.blue.opacity(0.06))
                            .cornerRadius(4)
                            .frame(maxWidth: .infinity, alignment: isFa ? .trailing : .leading)
                        
                        // Error type tag
                        HStack {
                            Text(fallacy.errorName.uppercased())
                                .font(.system(size: 11, weight: .black))
                                .foregroundColor(.white)
                                .padding(.horizontal, 8)
                                .padding(.vertical, 4)
                                .background(Color.red)
                                .cornerRadius(3)
                            Spacer()
                        }
                        
                        // Correction description
                        Text(fallacy.explanation)
                            .font(.system(size: 21, weight: .bold, design: .serif))
                            .foregroundColor(Color.red)
                            .lineSpacing(6)
                            .frame(maxWidth: .infinity, alignment: isFa ? .trailing : .leading)
                        
                        Divider()
                            .background(Color.gray.opacity(0.15))
                            .padding(.top, 6)
                    }
                }
            }
            
            // Programmatic Stamp & Details Block
            HStack(alignment: .bottom) {
                SealView(date: date, isFa: isFa)
                    .padding(.top, 20)
                Spacer()
                
                VStack(alignment: isFa ? .leading : .trailing, spacing: 6) {
                    Text(isFa ? "مدرس و ارزیاب منطق محض" : "Rational Philosophy Examiner")
                        .font(.system(size: 12, weight: .bold, design: .serif))
                        .foregroundColor(.gray)
                    Text(isFa ? "امضای منطک" : "MANTAK Academic Seal")
                        .font(.system(size: 13, weight: .black, design: .serif))
                        .foregroundColor(Color(red: 0.1, green: 0.2, blue: 0.5))
                }
                .padding(.bottom, 16)
            }
            .padding(.top, 30)
        }
        .padding(24)
        .background(
            ZStack {
                Color.white
                // Notebook lines effect
                GeometryReader { geo in
                    Path { path in
                        var y: CGFloat = 36
                        while y < geo.size.height {
                            path.move(to: CGPoint(x: 0, y: y))
                            path.addLine(to: CGPoint(x: geo.size.width, y: y))
                            y += 36
                        }
                    }
                    .stroke(Color.blue.opacity(0.08), lineWidth: 1)
                    
                    Path { path in
                        let x = isFa ? (geo.size.width - 45) : 45
                        path.move(to: CGPoint(x: x, y: 0))
                        path.addLine(to: CGPoint(x: x, y: geo.size.height))
                    }
                    .stroke(Color.red.opacity(0.18), lineWidth: 1.5)
                }
            }
        )
        .border(Color(red: 0.1, green: 0.2, blue: 0.5), width: 6)
        .environment(\.layoutDirection, isFa ? .rightToLeft : .leftToRight)
    }
}

// MARK: - Sharing Activity View Component
#if os(macOS)
struct ShareSheetView: NSViewRepresentable {
    var items: [Any]
    func makeNSView(context: Context) -> NSView {
        let view = NSView()
        DispatchQueue.main.async {
            if let firstItem = items.first {
                let picker = NSSharingServicePicker(items: [firstItem])
                if let window = view.window {
                    picker.show(relativeTo: .zero, of: window.contentView ?? view, preferredEdge: .minY)
                }
            }
        }
        return view
    }
    func updateNSView(_ nsView: NSView, context: Context) {}
}
#else
struct ShareSheetView: UIViewControllerRepresentable {
    var items: [Any]
    func makeUIViewController(context: Context) -> UIActivityViewController {
        UIActivityViewController(activityItems: items, applicationActivities: nil)
    }
    func updateUIViewController(_ uiViewController: UIActivityViewController, context: Context) {}
}
#endif

// MARK: - Main Application Root
struct ContentView: View {
    @StateObject private var historyStore = AppHistoryStore()
    @State private var isFa: Bool = true
    
    var currentStrings: AppStrings {
        isFa ? faStrings : enStrings
    }
    
    var body: some View {
        NavigationStack {
            VStack(spacing: 0) {
                // System Header Style
                HStack {
                    Text(currentStrings.appTitle)
                        .font(.system(size: 32, weight: .black, design: .serif))
                        .foregroundColor(Color(red: 0.1, green: 0.1, blue: 0.1))
                    
                    Spacer()
                    
                    // Brutalist Lang Toggle
                    Button(action: {
                        isFa.toggle()
                    }) {
                        Text(isFa ? "English" : "فارسی")
                            .font(.system(size: 14, weight: .black))
                            .foregroundColor(.white)
                            .padding(.horizontal, 12)
                            .padding(.vertical, 6)
                            .background(Color(red: 0.1, green: 0.1, blue: 0.1))
                            .cornerRadius(0)
                            .shadow(color: isFa ? .red : .blue, radius: 0, x: 2, y: 2)
                    }
                }
                .padding(.horizontal, 24)
                .padding(.top, 16)
                .padding(.bottom, 24)
                .background(Color(red: 0.95, green: 0.95, blue: 0.93))
                
                ScrollView {
                    VStack(spacing: 20) {
                        // 01 Analyze Card
                        NavigationLink(destination: AnalyzeScreenView(isFa: isFa, historyStore: historyStore)) {
                            MenuCard(number: "۰۱", title: currentStrings.analyze, subtitle: isFa ? "بررسی و کالبدشکافی عقلانی متن" : "Deep logical text analysis", color: .yellow)
                        }
                        
                        // 02 History Card
                        NavigationLink(destination: HistoryScreenView(isFa: isFa, historyStore: historyStore)) {
                            MenuCard(number: "۰۲", title: currentStrings.history, subtitle: isFa ? "بایگانی و ارزیابی‌های گذشته" : "Evaluation records", color: .blue)
                        }
                        
                        // 03 Spiritual Feedback Button
                        Button(action: {
                            openEmail()
                        }) {
                            MenuCard(number: "۰۳", title: currentStrings.spiritual, subtitle: isFa ? "ارسال بازخورد مستقیم به استاد" : "Direct impact on professors", color: .green)
                        }
                        
                        // 04 Material PayPal Support Button
                        Button(action: {
                            openPaypal()
                        }) {
                            MenuCard(number: "۰۴", title: currentStrings.material, subtitle: isFa ? "حمایت مالی مستقیم جهت توسعه برنامه" : "Support continuing academic logic", color: .orange)
                        }
                    }
                    .padding(24)
                }
                .background(Color(red: 0.95, green: 0.95, blue: 0.93))
            }
            .background(Color(red: 0.95, green: 0.95, blue: 0.93))
        }
    }
    
    private func openEmail() {
        let subject = currentStrings.emailSubject.addingPercentEncoding(withAllowedCharacters: .urlQueryAllowed) ?? ""
        let body = currentStrings.emailBody.addingPercentEncoding(withAllowedCharacters: .urlQueryAllowed) ?? ""
        if let url = URL(string: "mailto:Sobhan.Ganji@Yahoo.Com?subject=\(subject)&body=\(body)") {
            #if os(macOS)
            NSWorkspace.shared.open(url)
            #else
            UIApplication.shared.open(url)
            #endif
        }
    }
    
    private func openPaypal() {
        if let url = URL(string: "https://www.paypal.com/cgi-bin/webscr?cmd=_donations&business=Sobhan.Ganji@iCloud.com&currency_code=USD&source=url") {
            #if os(macOS)
            NSWorkspace.shared.open(url)
            #else
            UIApplication.shared.open(url)
            #endif
        }
    }
}

// MARK: - Menu Card Design Structure
struct MenuCard: View {
    let number: String
    let title: String
    let subtitle: String
    var color: Color
    
    var body: some View {
        HStack(spacing: 16) {
            Text(number)
                .font(.system(size: 38, weight: .black, design: .serif))
                .foregroundColor(color)
                .padding(.horizontal, 10)
            
            VStack(alignment: .leading, spacing: 4) {
                Text(title)
                    .font(.system(size: 19, weight: .black))
                    .foregroundColor(Color(red: 0.1, green: 0.1, blue: 0.1))
                
                Text(subtitle)
                    .font(.system(size: 12, weight: .bold))
                    .foregroundColor(.gray)
                    .multilineTextAlignment(.leading)
            }
            Spacer()
        }
        .padding(.vertical, 20)
        .padding(.horizontal, 16)
        .brutalistStyle(bg: .white, shadow: Color(red: 0.1, green: 0.1, blue: 0.1))
    }
}

// MARK: - Analyze Screen View
struct AnalyzeScreenView: View {
    let isFa: Bool
    @ObservedObject var historyStore: AppHistoryStore
    
    var currentStrings: AppStrings {
        isFa ? faStrings : enStrings
    }
    
    @State private var text: String = ""
    @State private var loading = false
    @State private var errorMessage: String? = nil
    @State private var analysisResult: [FallacyItem]? = nil
    @State private var showShareSheet = false
    @State private var shareImage: PlatformImage? = nil
    @State private var analysisDate = Date()
    
    var body: some View {
        VStack(spacing: 0) {
            // Screen Header
            HStack {
                Text(currentStrings.analyze)
                    .font(.system(size: 22, weight: .black))
                    .foregroundColor(Color(red: 0.1, green: 0.1, blue: 0.1))
                Spacer()
            }
            .padding(24)
            .background(Color(red: 0.95, green: 0.95, blue: 0.93))
            
            ScrollView {
                VStack(spacing: 24) {
                    TextEditor(text: $text)
                        .font(.system(.body, design: .serif))
                        .frame(minHeight: 180)
                        .padding(12)
                        .background(Color.white)
                        .border(Color(red: 0.1, green: 0.1, blue: 0.1), width: 3)
                        .shadow(color: Color(red: 0.1, green: 0.1, blue: 0.1), radius: 0, x: 5, y: 5)
                        .overlay(
                            Group {
                                if text.isEmpty {
                                    Text(currentStrings.analyzePlaceholder)
                                        .font(.system(.body, design: .serif))
                                        .foregroundColor(.gray.opacity(0.6))
                                        .padding(.leading, 18)
                                        .padding(.top, 20)
                                        .allowsHitTesting(false)
                                }
                            },
                            alignment: isFa ? .topTrailing : .topLeading
                        )
                        .multilineTextAlignment(isFa ? .trailing : .leading)
                        .environment(\.layoutDirection, isFa ? .rightToLeft : .leftToRight)
                    
                    if let errorMessage {
                        Text(errorMessage)
                            .font(.system(size: 14, weight: .bold))
                            .foregroundColor(.white)
                            .padding()
                            .frame(maxWidth: .infinity)
                            .background(Color.red)
                            .border(Color(red: 0.1, green: 0.1, blue: 0.1), width: 3)
                    }
                    
                    // Dispatch Button
                    Button(action: handleAnalyze) {
                        HStack {
                            Spacer()
                            if loading {
                                ProgressView()
                                    .padding(.trailing, 8)
                                Text(currentStrings.analyzing)
                                    .fontWeight(.black)
                            } else {
                                Text(currentStrings.analyzeBtn)
                                    .fontWeight(.black)
                            }
                            Spacer()
                        }
                        .padding(.vertical, 16)
                        .font(.system(size: 16))
                        .foregroundColor(.white)
                        .background(loading ? Color.gray : Color(red: 0.1, green: 0.1, blue: 0.1))
                        .border(Color(red: 0.1, green: 0.1, blue: 0.1), width: 3)
                        .shadow(color: loading ? .clear : .red, radius: 0, x: 5, y: 5)
                    }
                    .disabled(loading)
                    
                    // Analysis Report Paper Block
                    if let result = analysisResult {
                        VStack(spacing: 20) {
                            HStack {
                                Text(currentStrings.logicalAnalysis)
                                    .font(.system(size: 18, weight: .black))
                                Spacer()
                                
                                // Export Share Trigger
                                Button(action: triggerShareSheet) {
                                    HStack {
                                        Image(systemName: "square.and.arrow.up")
                                        Text(currentStrings.exportPdf)
                                    }
                                    .font(.system(size: 13, weight: .black))
                                    .foregroundColor(.white)
                                    .padding(.horizontal, 12)
                                    .padding(.vertical, 8)
                                    .background(Color.blue)
                                    .cornerRadius(0)
                                    .shadow(color: .black, radius: 0, x: 2, y: 2)
                                }
                            }
                            .padding(.top, 16)
                            
                            // Virtual Exam Sheet
                            ExamPaperView(text: text, fallacies: result, date: analysisDate, isFa: isFa)
                        }
                    }
                }
                .padding(24)
            }
            .background(Color(red: 0.95, green: 0.95, blue: 0.93))
        }
        .sheet(isPresented: $showShareSheet) {
            if let imageToShare = shareImage {
                ShareSheetView(items: [imageToShare])
            }
        }
    }
    
    private func handleAnalyze() {
        guard !text.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty else {
            errorMessage = currentStrings.errorRequired
            return
        }
        
        errorMessage = nil
        loading = true
        analysisResult = nil
        analysisDate = Date()
        
        // Define Web App API endpoint URL
        guard let url = URL(string: "https://ais-pre-6jzd7w3qbss3l53dcxvvz2-18944585449.europe-west3.run.app/api/analyze") else {
            errorMessage = "Developer URL error"
            loading = false
            return
        }
        
        var request = URLRequest(url: url)
        request.httpMethod = "POST"
        request.setValue("application/json", forHTTPHeaderField: "Content-Type")
        
        let payload = AnalysisRequest(text: text, lang: isFa ? "fa" : "en")
        guard let httpBody = try? JSONEncoder().encode(payload) else {
            errorMessage = "Marshalling failed"
            loading = false
            return
        }
        request.httpBody = httpBody
        
        URLSession.shared.dataTask(with: request) { data, response, error in
            DispatchQueue.main.async {
                loading = false
                if let error = error {
                    self.errorMessage = "Network error: \(error.localizedDescription)"
                    return
                }
                guard let data = data else {
                    self.errorMessage = "No data returned from analytical professor."
                    return
                }
                
                if let decodedResponse = try? JSONDecoder().decode(AnalysisResponse.self, from: data) {
                    self.analysisResult = decodedResponse.analysis
                    self.historyStore.add(text: self.text, fallacies: decodedResponse.analysis, lang: self.isFa ? "fa" : "en")
                } else if let errorResponse = try? JSONDecoder().decode(ErrorResponse.self, from: data) {
                    self.errorMessage = "Server error: \(errorResponse.error)"
                } else {
                    let rawResponse = String(data: data, encoding: .utf8) ?? "Unknown response"
                    self.errorMessage = "The professor is busy or analysis format crashed. Response: \(rawResponse)"
                }
            }
        }.resume()
    }
    
    // Renders the SwiftUI ExamPaperView offscreen as an absolute Image and uploads to ShareSheet
    @MainActor
    private func triggerShareSheet() {
        let viewToRender = ExamPaperView(text: text, fallacies: analysisResult ?? [], date: analysisDate, isFa: isFa)
            .frame(width: 480) // Constrained sizing for export
            .background(Color.white)
        
        let renderer = ImageRenderer(content: viewToRender)
        renderer.scale = 3.0 // High quality DPI for messages/emails
        
        #if os(macOS)
        if let nsImage = renderer.nsImage {
            self.shareImage = nsImage
            self.showShareSheet = true
        }
        #else
        if let uiImage = renderer.uiImage {
            self.shareImage = uiImage
            self.showShareSheet = true
        }
        #endif
    }
}

// MARK: - History Archiving Screen
struct HistoryScreenView: View {
    let isFa: Bool
    @ObservedObject var historyStore: AppHistoryStore
    
    var currentStrings: AppStrings {
        isFa ? faStrings : enStrings
    }
    
    var body: some View {
        VStack(spacing: 0) {
            // Header
            HStack {
                Text(currentStrings.history)
                    .font(.system(size: 22, weight: .black))
                    .foregroundColor(Color(red: 0.1, green: 0.1, blue: 0.1))
                Spacer()
            }
            .padding(24)
            .background(Color(red: 0.95, green: 0.95, blue: 0.93))
            
            if historyStore.items.isEmpty {
                VStack {
                    Spacer()
                    Text(currentStrings.historyEmpty)
                        .font(.system(.title3, design: .serif))
                        .foregroundColor(.gray)
                        .multilineTextAlignment(.center)
                        .padding()
                    Spacer()
                }
                .frame(maxWidth: .infinity)
                .background(Color(red: 0.95, green: 0.95, blue: 0.93))
            } else {
                List {
                    ForEach(historyStore.items) { item in
                        Section {
                            NavigationLink(destination: HistoryDetailView(item: item)) {
                                VStack(alignment: .leading, spacing: 8) {
                                    HStack {
                                        Text(formatTimestamp(item.timestamp, isFa: item.lang == "fa"))
                                            .font(.system(size: 12, weight: .bold, design: .monospaced))
                                            .foregroundColor(.gray)
                                        Spacer()
                                        
                                        Text(item.lang == "fa" ? "فارسی" : "English")
                                            .font(.system(size: 10, weight: .black))
                                            .padding(.horizontal, 6)
                                            .padding(.vertical, 3)
                                            .background(item.lang == "fa" ? Color.red.opacity(0.1) : Color.blue.opacity(0.1))
                                            .foregroundColor(item.lang == "fa" ? .red : .blue)
                                    }
                                    
                                    Text(item.text)
                                        .font(.system(size: 14, design: .serif))
                                        .foregroundColor(Color(red: 0.1, green: 0.1, blue: 0.1))
                                        .lineLimit(2)
                                        .frame(maxWidth: .infinity, alignment: item.lang == "fa" ? .trailing : .leading)
                                    
                                    HStack {
                                        Text(item.lang == "fa" ? "مغالطات شناسایی شده: \(item.fallacies.count)" : "Fallacies Identified: \(item.fallacies.count)")
                                            .font(.system(size: 12, weight: .black))
                                            .foregroundColor(item.fallacies.isEmpty ? .green : .red)
                                        Spacer()
                                    }
                                }
                                .padding(.vertical, 8)
                            }
                        }
                    }
                    .onDelete(perform: deleteItem)
                }
                .scrollContentBackground(.hidden)
                .background(Color(red: 0.95, green: 0.95, blue: 0.93))
            }
        }
    }
    
    private func deleteItem(at offsets: IndexSet) {
        historyStore.delete(at: offsets)
    }
    
    private func formatTimestamp(_ d: Date, isFa: Bool) -> String {
        let formatter = DateFormatter()
        formatter.locale = Locale(identifier: isFa ? "fa_IR" : "en_US")
        formatter.dateStyle = .medium
        formatter.timeStyle = .short
        return formatter.string(from: d)
    }
}

// MARK: - History Detail Display Sheet
struct HistoryDetailView: View {
    let item: HistoryItem
    @State private var showShareSheet = false
    @State private var shareImage: PlatformImage? = nil
    
    var body: some View {
        VStack(spacing: 0) {
            ScrollView {
                VStack(spacing: 24) {
                    HStack {
                        Spacer()
                        Button(action: triggerShareSheet) {
                            HStack {
                                Image(systemName: "square.and.arrow.up")
                                Text(item.lang == "fa" ? "اشتراک‌گذاری کارنامه" : "Share Report Card")
                            }
                            .font(.system(size: 13, weight: .black))
                            .foregroundColor(.white)
                            .padding(.horizontal, 14)
                            .padding(.vertical, 10)
                            .background(Color.blue)
                            .cornerRadius(0)
                            .shadow(color: .black, radius: 0, x: 2, y: 2)
                        }
                    }
                    .padding(.horizontal, 24)
                    .padding(.top, 16)
                    
                    ExamPaperView(text: item.text, fallacies: item.fallacies, date: item.timestamp, isFa: item.lang == "fa")
                        .padding(24)
                }
            }
            .background(Color(red: 0.95, green: 0.95, blue: 0.93))
        }
        .sheet(isPresented: $showShareSheet) {
            if let imageToShare = shareImage {
                ShareSheetView(items: [imageToShare])
            }
        }
    }
    
    @MainActor
    private func triggerShareSheet() {
        let viewToRender = ExamPaperView(text: item.text, fallacies: item.fallacies, date: item.timestamp, isFa: item.lang == "fa")
            .frame(width: 480)
            .background(Color.white)
        
        let renderer = ImageRenderer(content: viewToRender)
        renderer.scale = 3.0
        
        #if os(macOS)
        if let nsImage = renderer.nsImage {
            self.shareImage = nsImage
            self.showShareSheet = true
        }
        #else
        if let uiImage = renderer.uiImage {
            self.shareImage = uiImage
            self.showShareSheet = true
        }
        #endif
    }
}
