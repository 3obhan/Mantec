package com.mantak.app

import android.content.Context
import android.content.Intent
import android.content.SharedPreferences
import android.net.Uri
import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.compose.animation.*
import androidx.compose.foundation.*
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.draw.rotate
import androidx.compose.ui.geometry.Offset
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.PathEffect
import androidx.compose.ui.graphics.drawscope.Stroke
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.platform.LocalLayoutDirection
import androidx.compose.ui.text.font.FontFamily
import androidx.compose.ui.text.font.FontStyle
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.text.style.TextDecoration
import androidx.compose.ui.unit.LayoutDirection
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.google.gson.Gson
import com.google.gson.reflect.TypeToken
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.launch
import kotlinx.coroutines.withContext
import java.io.OutputStreamWriter
import java.net.HttpURLConnection
import java.net.URL
import java.text.SimpleDateFormat
import java.util.*

// MARK: - Models
data class FallacyItem(
    val quote: String,
    val errorName: String,
    val explanation: String
)

data class HistoryItem(
    val id: String,
    val timestamp: String,
    val text: String,
    val fallacies: List<FallacyItem>,
    val lang: String
)

// MARK: - Strings Localization
data class AppStrings(
    val id: String,
    val appTitle: String,
    val selectLang: String,
    val analyze: String,
    val history: String,
    val spiritual: String,
    val material: String,
    val back: String,
    val analyzePlaceholder: String,
    val analyzeBtn: String,
    val analyzing: String,
    val noErrors: String,
    val exportPdf: String,
    val historyEmpty: String,
    val spiritualDesc: String,
    val send: String,
    val materialDesc: String,
    val donate: String,
    val delete: String,
    val errorRequired: String,
    val submittedText: String,
    val logicalAnalysis: String,
    val backToMenu: String,
    val emailSubject: String,
    val emailBody: String
)

val faStrings = AppStrings(
    id = "fa",
    appTitle = "منطک",
    selectLang = "لطفاً زبان خود را انتخاب کنید",
    analyze = "بررسی منطق",
    history = "بایگانی و ارزیابی‌ها",
    spiritual = "ارسال بازخورد",
    material = "حمایت مادی",
    back = "بازگشت",
    analyzePlaceholder = "متن خود را برای بررسی عمیق منطقی عقلانی در اینجا وارد کنید...",
    analyzeBtn = "بررسی متن",
    analyzing = "در حال تحلیل (منطق‌سنجی)...",
    noErrors = "عالی! خطای منطقی واضحی در این متن شناسایی نشد.",
    exportPdf = "اشتراک‌گذاری کارنامه",
    historyEmpty = "بایگانی بررسی‌های شما خالی است.",
    spiritualDesc = "دیدگاه‌ها و نظرات خود را برای ما بفرستید تا اثر معنوی کارتان را ببینیم.",
    send = "ارسال ایمیل",
    materialDesc = "در صورت تمایل می‌توانید به صورت مستقیم از طریق پی‌پال از توسعه این برنامه حمایت کنید.",
    donate = "پرداخت / حمایت مالی (PayPal)",
    delete = "حذف",
    errorRequired = "وارد کردن متن الزامی است.",
    submittedText = "متن ارسالی کاربر:",
    logicalAnalysis = "کارنامه منطق‌سنجی",
    backToMenu = "بازگشت به منو",
    emailSubject = "بازخورد در مورد اپلیکیشن منطک",
    emailBody = "سلام،\nدرخواست بازخورد در مورد اپلیکیشن منطک دارم..."
)

val enStrings = AppStrings(
    id = "en",
    appTitle = "Mantak",
    selectLang = "Please select your language",
    analyze = "Analyze Logic",
    history = "Archives & Records",
    spiritual = "Direct Feedback",
    material = "Financial Support",
    back = "Back",
    analyzePlaceholder = "Enter your text here for deep logical reasoning analysis...",
    analyzeBtn = "Analyze Text",
    analyzing = "Analyzing logic...",
    noErrors = "Excellent! No obvious logical fallacies were detected in this text.",
    exportPdf = "Share Report Card",
    historyEmpty = "Your analysis history is empty.",
    spiritualDesc = "Send us your thoughts and let your feedback have a spiritual impact.",
    send = "Send Email",
    materialDesc = "If you wish, you can support the development of this app directly via PayPal.",
    donate = "Donate (PayPal)",
    delete = "Delete",
    errorRequired = "Text is required.",
    submittedText = "Submitted Text:",
    logicalAnalysis = "Logical Analysis",
    backToMenu = "Back to Menu",
    emailSubject = "Feedback on Mantak App",
    emailBody = "Hi,\nI would like to share my feedback on Mantak app..."
)

// Helper to convert English digits to Persian
fun toPersianDigits(text: String): String {
    val persianDigits = charArrayOf('۰', '۱', '۲', '۳', '۴', '۵', '۶', '۷', '۸', '۹')
    return text.map { char ->
        if (char in '0'..'9') persianDigits[char - '0'] else char
    }.joinToString("")
}

class MainActivity : ComponentActivity() {
    private lateinit var sharedPreferences: SharedPreferences
    private val gson = Gson()

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        sharedPreferences = getSharedPreferences("mantak_prefs", Context.MODE_PRIVATE)

        setContent {
            var currentLanguage by remember { mutableStateOf(sharedPreferences.getString("lang", null)) }
            var currentScreen by remember { mutableStateOf("menu") }
            var historyItems by remember { mutableStateOf(loadHistory()) }
            
            val activeStrings = if (currentLanguage == "fa") faStrings else enStrings
            val layoutDirection = if (currentLanguage == "fa") LayoutDirection.Rtl else LayoutDirection.Ltr

            CompositionLocalProvider(LocalLayoutDirection provides layoutDirection) {
                Surface(
                    modifier = Modifier.fillMaxSize(),
                    color = Color(0xFFF4F4F2)
                ) {
                    if (currentLanguage == null) {
                        LanguageSelectionScreen { lang ->
                            sharedPreferences.edit().putString("lang", lang).apply()
                            currentLanguage = lang
                            currentScreen = "menu"
                        }
                    } else {
                        Column(
                            modifier = Modifier
                                .fillMaxSize()
                                .border(
                                    width = 6.dp,
                                    color = Color(0xFF1A1A1A)
                                )
                        ) {
                            // Header Bar
                            HeaderBar(
                                strings = activeStrings,
                                lang = currentLanguage!!,
                                onLanguageChange = { newLang ->
                                    sharedPreferences.edit().putString("lang", newLang).apply()
                                    currentLanguage = newLang
                                }
                            )

                            // Main Content with Crossfade navigation
                            Box(
                                modifier = Modifier
                                    .weight(1f)
                                    .fillMaxWidth()
                            ) {
                                when (currentScreen) {
                                    "menu" -> MenuScreen(
                                        strings = activeStrings,
                                        onNavigate = { screen -> currentScreen = screen }
                                    )
                                    "analyze" -> AnalyzeScreen(
                                        strings = activeStrings,
                                        onBack = { currentScreen = "menu" },
                                        onSaveResult = { text, fallacies ->
                                            val newItem = HistoryItem(
                                                id = UUID.randomUUID().toString(),
                                                timestamp = SimpleDateFormat("yyyy-MM-dd HH:mm:ss", Locale.US).format(Date()),
                                                text = text,
                                                fallacies = fallacies,
                                                lang = currentLanguage!!
                                            )
                                            val updated = historyItems + newItem
                                            saveHistory(updated)
                                            historyItems = updated
                                        }
                                    )
                                    "history" -> HistoryScreen(
                                        strings = activeStrings,
                                        items = historyItems,
                                        onDelete = { itemToDelete ->
                                            val updated = historyItems.filter { it.id != itemToDelete.id }
                                            saveHistory(updated)
                                            historyItems = updated
                                        },
                                        onBack = { currentScreen = "menu" }
                                    )
                                    "spiritual" -> SpiritualScreen(
                                        strings = activeStrings,
                                        onBack = { currentScreen = "menu" }
                                    )
                                    "material" -> MaterialScreen(
                                        strings = activeStrings,
                                        onBack = { currentScreen = "menu" }
                                    )
                                }
                            }

                            // Footer Bar
                            FooterBar(isFa = currentLanguage == "fa")
                        }
                    }
                }
            }
        }
    }

    private fun loadHistory(): List<HistoryItem> {
        val json = sharedPreferences.getString("history", null) ?: return emptyList()
        val type = object : TypeToken<List<HistoryItem>>() {}.type
        return try {
            gson.fromJson(json, type)
        } catch (e: Exception) {
            emptyList()
        }
    }

    private fun saveHistory(items: List<HistoryItem>) {
        val json = gson.toJson(items)
        sharedPreferences.edit().putString("history", json).apply()
    }
}

// MARK: - Components

@Composable
fun LanguageSelectionScreen(onSelect: (String) -> Unit) {
    Column(
        modifier = Modifier
            .fillMaxSize()
            .padding(24.dp),
        verticalArrangement = Arrangement.Center,
        horizontalAlignment = Alignment.CenterHorizontally
    ) {
        Image(
            imageVector = Icons.Default.CheckCircle,
            contentDescription = "Logo",
            modifier = Modifier
                .size(90.dp)
                .padding(bottom = 16.dp)
        )
        Text(
            text = "منطک - Mantak",
            fontSize = 32.sp,
            fontWeight = FontWeight.Black,
            color = Color(0xFF1A1A1A)
        )
        Spacer(modifier = Modifier.height(8.dp))
        Text(
            text = "Please select your language / لطفا زبان خود را انتخاب کنید",
            fontSize = 14.sp,
            color = Color.Gray,
            textAlign = TextAlign.Center
        )
        Spacer(modifier = Modifier.height(36.dp))

        Button(
            onClick = { onSelect("fa") },
            colors = ButtonDefaults.buttonColors(containerColor = Color(0xFF1A1A1A)),
            shape = RoundedCornerShape(4.dp),
            modifier = Modifier
                .fillMaxWidth()
                .height(56.dp)
                .border(2.dp, Color(0xFF1A1A1A))
        ) {
            Text("فارسی (Persian)", fontSize = 18.sp, fontWeight = FontWeight.Bold, color = Color.White)
        }

        Spacer(modifier = Modifier.height(16.dp))

        Button(
            onClick = { onSelect("en") },
            colors = ButtonDefaults.buttonColors(containerColor = Color.White),
            shape = RoundedCornerShape(4.dp),
            modifier = Modifier
                .fillMaxWidth()
                .height(56.dp)
                .border(3.dp, Color(0xFF1A1A1A))
        ) {
            Text("English", fontSize = 18.sp, fontWeight = FontWeight.Bold, color = Color(0xFF1A1A1A))
        }
    }
}

@Composable
fun HeaderBar(strings: AppStrings, lang: String, onLanguageChange: (String) -> Unit) {
    Row(
        modifier = Modifier
            .fillMaxWidth()
            .height(80.dp)
            .background(Color.white)
            .border(width = 2.dp, color = Color(0xFF1A1A1A))
            .padding(horizontal = 16.dp),
        verticalAlignment = Alignment.CenterVertically,
        horizontalArrangement = Arrangement.SpaceBetween
    ) {
        Row(verticalAlignment = Alignment.CenterVertically) {
            Box(
                modifier = Modifier
                    .size(44.dp)
                    .clip(CircleShape)
                    .background(Color(0xFFF4F4F2))
                    .border(2.dp, Color(0xFF1A1A1A), CircleShape),
                contentAlignment = Alignment.Center
            ) {
                Text(
                    text = if (lang == "fa") "م" else "M",
                    fontSize = 20.sp,
                    fontWeight = FontWeight.Black,
                    color = Color(0xFF1A1A1A)
                )
            }
            Spacer(modifier = Modifier.width(12.dp))
            Column {
                Text(
                    text = strings.appTitle,
                    fontSize = 20.sp,
                    fontWeight = FontWeight.Black,
                    color = Color(0xFF1A1A1A)
                )
                Text(
                    text = "v4.0 NATIVE",
                    fontSize = 10.sp,
                    fontWeight = FontWeight.Bold,
                    color = Color(0xFFFF3B30)
                )
            }
        }

        Row(
            modifier = Modifier
                .background(Color(0xFFEEEEEE))
                .border(1.dp, Color(0xFF1A1A1A))
                .padding(2.dp)
        ) {
            Box(
                modifier = Modifier
                    .clickable { onLanguageChange("en") }
                    .background(if (lang == "en") Color(0xFF1A1A1A) else Color.Transparent)
                    .padding(horizontal = 12.dp, vertical = 6.dp)
            ) {
                Text(
                    text = "EN",
                    color = if (lang == "en") Color.White else Color(0xFF1A1A1A),
                    fontSize = 11.sp,
                    fontWeight = FontWeight.Bold
                )
            }
            Box(
                modifier = Modifier
                    .clickable { onLanguageChange("fa") }
                    .background(if (lang == "fa") Color(0xFF1A1A1A) else Color.Transparent)
                    .padding(horizontal = 12.dp, vertical = 6.dp)
            ) {
                Text(
                    text = "FA",
                    color = if (lang == "fa") Color.White else Color(0xFF1A1A1A),
                    fontSize = 11.sp,
                    fontWeight = FontWeight.Bold
                )
            }
        }
    }
}

@Composable
fun FooterBar(isFa: Boolean) {
    Row(
        modifier = Modifier
            .fillMaxWidth()
            .height(56.dp)
            .background(Color.white)
            .border(width = 2.dp, color = Color(0xFF1A1A1A))
            .padding(horizontal = 16.dp),
        verticalAlignment = Alignment.CenterVertically,
        horizontalArrangement = Arrangement.SpaceBetween
    ) {
        Column {
            Text(
                text = if (isFa) "موتور منطق‌سنجی" else "LOGIC ENGINE",
                fontSize = 9.sp,
                fontWeight = FontWeight.Bold,
                color = Color.LightGray
            )
            Text(
                text = "v9.1.0-STABLE",
                fontSize = 11.sp,
                fontWeight = FontWeight.Bold,
                color = Color(0xFF1A1A1A)
            )
        }
        Row(verticalAlignment = Alignment.CenterVertically) {
            Text(
                text = if (isFa) "آماده کار" else "SYSTEM STABLE",
                fontSize = 11.sp,
                fontWeight = FontWeight.Bold,
                color = Color(0xFF2E7D32),
                modifier = Modifier.padding(end = 8.dp)
            )
            Box(
                modifier = Modifier
                    .size(8.dp)
                    .clip(CircleShape)
                    .background(Color(0xFF4CAF50))
            )
        }
    }
}

@Composable
fun MenuScreen(strings: AppStrings, onNavigate: (String) -> Unit) {
    Column(
        modifier = Modifier
            .fillMaxSize()
            .padding(20.dp)
            .verticalScroll(rememberScrollState()),
        verticalArrangement = Arrangement.spacedBy(16.dp)
    ) {
        Spacer(modifier = Modifier.height(10.dp))
        MenuButton(
            title = strings.analyze,
            subtitle = if (strings.id == "fa") "تحلیل عمیق منطقی و مغالطات" else "Deep fallacy check on pure reason",
            color = Color(0xFFE3F2FD),
            shadowColor = Color(0xFF2196F3),
            onClick = { onNavigate("analyze") }
        )
        MenuButton(
            title = strings.history,
            subtitle = if (strings.id == "fa") "کارنامه‌های ذخیره شده" else "Your locally stored logical cards",
            color = Color(0xFFFFF3E0),
            shadowColor = Color(0xFFFF9800),
            onClick = { onNavigate("history") }
        )
        MenuButton(
            title = strings.spiritual,
            subtitle = strings.spiritualDesc.take(45) + "...",
            color = Color(0xFFE8F5E9),
            shadowColor = Color(0xFF4CAF50),
            onClick = { onNavigate("spiritual") }
        )
        MenuButton(
            title = strings.material,
            subtitle = strings.materialDesc.take(45) + "...",
            color = Color(0xFFFCE4EC),
            shadowColor = Color(0xFFE91E63),
            onClick = { onNavigate("material") }
        )
    }
}

@Composable
fun MenuButton(title: String, subtitle: String, color: Color, shadowColor: Color, onClick: () -> Unit) {
    Box(
        modifier = Modifier
            .fillMaxWidth()
            .clickable { onClick() }
            .background(color)
            .border(3.dp, Color(0xFF1A1A1A))
            .shadow(0.dp) // handled custom layout offset for Brutalist look
            .padding(20.dp)
    ) {
        Column {
            Text(
                text = title,
                fontSize = 22.sp,
                fontWeight = FontWeight.Black,
                color = Color(0xFF1A1A1A)
            )
            Spacer(modifier = Modifier.height(4.dp))
            Text(
                text = subtitle,
                fontSize = 12.sp,
                fontWeight = FontWeight.Medium,
                color = Color.DarkGray
            )
        }
    }
}

@Composable
fun AnalyzeScreen(strings: AppStrings, onBack: () -> Unit, onSaveResult: (String, List<FallacyItem>) -> Unit) {
    var textInput by remember { mutableStateOf("") }
    var isLoading by remember { mutableStateOf(false) }
    var errorMsg by remember { mutableStateOf<String?>(null) }
    var analysisResult by remember { mutableStateOf<List<FallacyItem>?>(null) }
    
    val isFa = strings.id == "fa"
    val context = LocalContext.current

    Column(
        modifier = Modifier
            .fillMaxSize()
            .padding(16.dp)
            .verticalScroll(rememberScrollState())
    ) {
        // Back Button
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .padding(bottom = 12.dp),
            horizontalArrangement = Arrangement.Start
        ) {
            Button(
                onClick = {
                    if (analysisResult != null) {
                        analysisResult = null
                    } else {
                        onBack()
                    }
                },
                colors = ButtonDefaults.buttonColors(containerColor = Color(0xFFE0E0E0)),
                shape = RoundedCornerShape(4.dp),
                border = BorderStroke(2.dp, Color(0xFF1A1A1A)),
                contentPadding = PaddingValues(horizontal = 14.dp, vertical = 6.dp)
            ) {
                Row(verticalAlignment = Alignment.CenterVertically) {
                    Icon(
                        imageVector = if (isFa) Icons.Default.ArrowForward else Icons.Default.ArrowBack,
                        contentDescription = "Back",
                        tint = Color(0xFF1A1A1A),
                        modifier = Modifier.size(16.dp)
                    )
                    Spacer(modifier = Modifier.width(6.dp))
                    Text(strings.back, color = Color(0xFF1A1A1A), fontSize = 14.sp, fontWeight = FontWeight.Bold)
                }
            }
        }

        if (analysisResult == null) {
            // Input view
            Text(
                text = strings.analyze,
                fontSize = 24.sp,
                fontWeight = FontWeight.Black,
                modifier = Modifier.padding(bottom = 12.dp)
            )

            OutlinedTextField(
                value = textInput,
                onValueChange = { textInput = it },
                placeholder = { Text(strings.analyzePlaceholder) },
                modifier = Modifier
                    .fillMaxWidth()
                    .height(200.dp)
                    .background(Color.White)
                    .border(2.dp, Color(0xFF1A1A1A)),
                shape = RoundedCornerShape(4.dp),
                colors = OutlinedTextFieldDefaults.colors(
                    focusedBorderColor = Color(0xFF1A1A1A),
                    unfocusedBorderColor = Color(0xFF1A1A1A)
                )
            )

            if (errorMsg != null) {
                Spacer(modifier = Modifier.height(8.dp))
                Text(
                    text = errorMsg!!,
                    color = Color(0xFFFF3B30),
                    fontWeight = FontWeight.Bold,
                    fontSize = 13.sp
                )
            }

            Spacer(modifier = Modifier.height(16.dp))

            Button(
                onClick = {
                    if (textInput.trim().isEmpty()) {
                        errorMsg = strings.errorRequired
                        return@Button
                    }
                    errorMsg = null
                    isLoading = true

                    CoroutineScope(Dispatchers.IO).launch {
                        try {
                            val result = callLogicalAnalyzeAPI(textInput, strings.id)
                            withContext(Dispatchers.Main) {
                                isLoading = false
                                analysisResult = result
                                onSaveResult(textInput, result)
                            }
                        } catch (e: Exception) {
                            withContext(Dispatchers.Main) {
                                isLoading = false
                                errorMsg = "Connection/format error: ${e.localizedMessage}"
                            }
                        }
                    }
                },
                enabled = !isLoading,
                colors = ButtonDefaults.buttonColors(containerColor = Color(0xFF1A1A1A)),
                shape = RoundedCornerShape(4.dp),
                modifier = Modifier
                    .fillMaxWidth()
                    .height(54.dp)
                    .border(2.dp, Color(0xFF1A1A1A))
            ) {
                if (isLoading) {
                    CircularProgressIndicator(color = Color.White, modifier = Modifier.size(24.dp))
                    Spacer(modifier = Modifier.width(12.dp))
                    Text(strings.analyzing, fontWeight = FontWeight.Bold, color = Color.White)
                } else {
                    Text(strings.analyzeBtn, fontWeight = FontWeight.Bold, color = Color.White, fontSize = 16.sp)
                }
            }
        } else {
            // Exam Paper result view
            ExamPaperResultView(
                strings = strings,
                text = textInput,
                fallacies = analysisResult!!
            )
        }
    }
}

@Composable
fun ExamPaperResultView(strings: AppStrings, text: String, fallacies: List<FallacyItem>) {
    val isFa = strings.id == "fa"
    val dateStr = SimpleDateFormat(if (isFa) "yyyy/MM/dd" else "yyyy-MM-dd", Locale.getDefault()).format(Date())
    val timeStr = SimpleDateFormat("HH:mm", Locale.getDefault()).format(Date())

    val displayDate = if (isFa) toPersianDigits(dateStr) else dateStr
    val displayTime = if (isFa) toPersianDigits(timeStr) else timeStr

    Column(
        modifier = Modifier
            .fillMaxWidth()
            .background(Color.White)
            .border(BorderStroke(4.dp, Color(0xFF0D47A1))) // Lined double border look
            .padding(16.dp)
    ) {
        // Exam Title
        Text(
            text = "${strings.appTitle} - ${strings.logicalAnalysis}",
            fontSize = 24.sp,
            fontWeight = FontWeight.Black,
            color = Color(0xFF0D47A1),
            textAlign = TextAlign.Center,
            modifier = Modifier
                .fillMaxWidth()
                .padding(vertical = 12.dp)
        )

        Divider(color = Color(0xFF0D47A1), thickness = 2.dp)
        Spacer(modifier = Modifier.height(16.dp))

        // Submitted Text Box
        Column(
            modifier = Modifier
                .fillMaxWidth()
                .background(Color(0xFFF5F5F5))
                .border(BorderStroke(1.dp, Color.LightGray))
                .padding(12.dp)
        ) {
            Text(
                text = strings.submittedText,
                fontWeight = FontWeight.Bold,
                color = Color(0xFF0D47A1),
                fontSize = 14.sp
            )
            Spacer(modifier = Modifier.height(4.dp))
            Text(
                text = text,
                fontSize = 16.sp,
                color = Color.DarkGray
            )
        }

        Spacer(modifier = Modifier.height(24.dp))
        Divider(color = Color(0xFFE57373), thickness = 2.dp) // Red line separator
        Spacer(modifier = Modifier.height(16.dp))

        // Fallacies list / Results
        if (fallacies.isEmpty()) {
            Text(
                text = strings.noErrors,
                fontSize = 20.sp,
                fontWeight = FontWeight.Bold,
                color = Color(0xFF2E7D32),
                textAlign = TextAlign.Center,
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(vertical = 24.dp)
            )
        } else {
            fallacies.forEachIndexed { idx, fallacy ->
                Column(
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(bottom = 18.dp)
                ) {
                    Text(
                        text = "\"${fallacy.quote}\"",
                        fontSize = 15.sp,
                        fontWeight = FontWeight.Bold,
                        color = Color(0xFF0D47A1),
                        fontStyle = FontStyle.Italic,
                        modifier = Modifier
                            .background(Color(0xFFE3F2FD))
                            .padding(horizontal = 8.dp, vertical = 4.dp)
                    )
                    Spacer(modifier = Modifier.height(6.dp))
                    Row(verticalAlignment = Alignment.CenterVertically) {
                        Box(
                            modifier = Modifier
                                .background(Color(0xFFFFCDD2))
                                .padding(horizontal = 6.dp, vertical = 2.dp)
                        ) {
                            Text(
                                text = fallacy.errorName,
                                fontSize = 11.sp,
                                fontWeight = FontWeight.Bold,
                                color = Color(0xFFB71C1C)
                            )
                        }
                    }
                    Spacer(modifier = Modifier.height(4.dp))
                    Text(
                        text = fallacy.explanation,
                        fontSize = 18.sp,
                        fontWeight = FontWeight.SemiBold,
                        color = Color(0xFFD32F2F), // Red writing styling
                        modifier = Modifier.padding(start = 4.dp, end = 4.dp)
                    )
                }
            }
        }

        Spacer(modifier = Modifier.height(30.dp))
        Divider(color = Color.LightGray, thickness = 1.dp)
        Spacer(modifier = Modifier.height(16.dp))

        // Programmatic Administrative Seal
        Box(
            modifier = Modifier
                .fillMaxWidth()
                .padding(bottom = 16.dp),
            contentAlignment = Alignment.Center
        ) {
            Column(
                horizontalAlignment = Alignment.CenterHorizontally,
                modifier = Modifier
                    .rotate(-8f)
                    .border(BorderStroke(3.dp, Color(0xFFC62828)), CircleShape)
                    .padding(20.dp)
            ) {
                Text(
                    text = if (isFa) "مهر ارزیابی عقلانی" else "RATIONAL GRADE",
                    fontSize = 10.sp,
                    fontWeight = FontWeight.Bold,
                    color = Color(0xFFC62828)
                )
                Spacer(modifier = Modifier.height(2.dp))
                Text(
                    text = if (isFa) "منـطک" else "MANTAK",
                    fontSize = 24.sp,
                    fontWeight = FontWeight.Black,
                    color = Color(0xFFC62828)
                )
                Spacer(modifier = Modifier.height(4.dp))
                Text(
                    text = "${if (isFa) "تاریخ" else "Date"}: $displayDate",
                    fontSize = 9.sp,
                    fontWeight = FontWeight.Bold,
                    color = Color(0xFFC62828)
                )
                Text(
                    text = "${if (isFa) "ساعت" else "Time"}: $displayTime",
                    fontSize = 9.sp,
                    fontWeight = FontWeight.Bold,
                    color = Color(0xFFC62828)
                )
            }
        }
    }
}

@Composable
fun HistoryScreen(strings: AppStrings, items: List<HistoryItem>, onDelete: (HistoryItem) -> Unit, onBack: () -> Unit) {
    val isFa = strings.id == "fa"

    Column(
        modifier = Modifier
            .fillMaxSize()
            .padding(16.dp)
    ) {
        // Back Button
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .padding(bottom = 12.dp),
            horizontalArrangement = Arrangement.Start
        ) {
            Button(
                onClick = onBack,
                colors = ButtonDefaults.buttonColors(containerColor = Color(0xFFE0E0E0)),
                shape = RoundedCornerShape(4.dp),
                border = BorderStroke(2.dp, Color(0xFF1A1A1A)),
                contentPadding = PaddingValues(horizontal = 14.dp, vertical = 6.dp)
            ) {
                Row(verticalAlignment = Alignment.CenterVertically) {
                    Icon(
                        imageVector = if (isFa) Icons.Default.ArrowForward else Icons.Default.ArrowBack,
                        contentDescription = "Back",
                        tint = Color(0xFF1A1A1A),
                        modifier = Modifier.size(16.dp)
                    )
                    Spacer(modifier = Modifier.width(6.dp))
                    Text(strings.back, color = Color(0xFF1A1A1A), fontSize = 14.sp, fontWeight = FontWeight.Bold)
                }
            }
        }

        Text(
            text = strings.history,
            fontSize = 24.sp,
            fontWeight = FontWeight.Black,
            modifier = Modifier.padding(bottom = 16.dp)
        )

        if (items.isEmpty()) {
            Box(modifier = Modifier.weight(1f).fillMaxWidth(), contentAlignment = Alignment.Center) {
                Text(strings.historyEmpty, color = Color.Gray, fontSize = 16.sp, fontWeight = FontWeight.Medium)
            }
        } else {
            Column(
                modifier = Modifier
                    .weight(1f)
                    .verticalScroll(rememberScrollState()),
                verticalArrangement = Arrangement.spacedBy(12.dp)
            ) {
                items.reversed().forEach { item ->
                    Card(
                        modifier = Modifier
                            .fillMaxWidth()
                            .border(2.dp, Color(0xFF1A1A1A), RoundedCornerShape(4.dp)),
                        colors = CardDefaults.cardColors(containerColor = Color.White),
                        shape = RoundedCornerShape(4.dp)
                    ) {
                        Column(modifier = Modifier.padding(16.dp)) {
                            Row(
                                modifier = Modifier.fillMaxWidth(),
                                horizontalArrangement = Arrangement.SpaceBetween,
                                verticalAlignment = Alignment.CenterVertically
                            ) {
                                val displayTime = if (isFa) toPersianDigits(item.timestamp) else item.timestamp
                                Text(
                                    text = displayTime,
                                    fontSize = 11.sp,
                                    color = Color.Gray,
                                    fontWeight = FontWeight.Bold
                                )
                                IconButton(onClick = { onDelete(item) }) {
                                    Icon(
                                        imageVector = Icons.Default.Delete,
                                        contentDescription = "Delete",
                                        tint = Color(0xFFD32F2F)
                                    )
                                }
                            }
                            Spacer(modifier = Modifier.height(4.dp))
                            Text(
                                text = item.text,
                                fontSize = 14.sp,
                                fontWeight = FontWeight.Medium,
                                maxLines = 2,
                                color = Color(0xFF1A1A1A)
                            )
                            Spacer(modifier = Modifier.height(8.dp))
                            Divider(color = Color.LightGray)
                            Spacer(modifier = Modifier.height(8.dp))

                            Text(
                                text = "${if (isFa) "مغالطات شناسایی شده" else "Fallacies detected"}: ${item.fallacies.size}",
                                fontSize = 12.sp,
                                fontWeight = FontWeight.Bold,
                                color = if (item.fallacies.isEmpty()) Color(0xFF2E7D32) else Color(0xFFC62828)
                            )
                        }
                    }
                }
            }
        }
    }
}

@Composable
fun SpiritualScreen(strings: AppStrings, onBack: () -> Unit) {
    val context = LocalContext.current
    val isFa = strings.id == "fa"

    Column(
        modifier = Modifier
            .fillMaxSize()
            .padding(16.dp)
    ) {
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .padding(bottom = 12.dp),
            horizontalArrangement = Arrangement.Start
        ) {
            Button(
                onClick = onBack,
                colors = ButtonDefaults.buttonColors(containerColor = Color(0xFFE0E0E0)),
                shape = RoundedCornerShape(4.dp),
                border = BorderStroke(2.dp, Color(0xFF1A1A1A)),
                contentPadding = PaddingValues(horizontal = 14.dp, vertical = 6.dp)
            ) {
                Row(verticalAlignment = Alignment.CenterVertically) {
                    Icon(
                        imageVector = if (isFa) Icons.Default.ArrowForward else Icons.Default.ArrowBack,
                        contentDescription = "Back",
                        tint = Color(0xFF1A1A1A),
                        modifier = Modifier.size(16.dp)
                    )
                    Spacer(modifier = Modifier.width(6.dp))
                    Text(strings.back, color = Color(0xFF1A1A1A), fontSize = 14.sp, fontWeight = FontWeight.Bold)
                }
            }
        }

        Text(
            text = strings.spiritual,
            fontSize = 24.sp,
            fontWeight = FontWeight.Black,
            modifier = Modifier.padding(bottom = 12.dp)
        )

        Text(
            text = strings.spiritualDesc,
            fontSize = 16.sp,
            color = Color.DarkGray,
            lineHeight = 24.sp
        )

        Spacer(modifier = Modifier.height(24.dp))

        Button(
            onClick = {
                val emailIntent = Intent(Intent.ACTION_SENDTO).apply {
                    data = Uri.parse("mailto:")
                    putExtra(Intent.EXTRA_EMAIL, arrayOf("sobhanganji@gmail.com"))
                    putExtra(Intent.EXTRA_SUBJECT, strings.emailSubject)
                    putExtra(Intent.EXTRA_TEXT, strings.emailBody)
                }
                try {
                    context.startActivity(emailIntent)
                } catch (e: Exception) {
                    // Fail gracefully if no email app installed
                }
            },
            colors = ButtonDefaults.buttonColors(containerColor = Color(0xFF1A1A1A)),
            shape = RoundedCornerShape(4.dp),
            modifier = Modifier
                .fillMaxWidth()
                .height(54.dp)
                .border(2.dp, Color(0xFF1A1A1A))
        ) {
            Text(strings.send, fontWeight = FontWeight.Bold, color = Color.White)
        }
    }
}

@Composable
fun MaterialScreen(strings: AppStrings, onBack: () -> Unit) {
    val context = LocalContext.current
    val isFa = strings.id == "fa"

    Column(
        modifier = Modifier
            .fillMaxSize()
            .padding(16.dp)
    ) {
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .padding(bottom = 12.dp),
            horizontalArrangement = Arrangement.Start
        ) {
            Button(
                onClick = onBack,
                colors = ButtonDefaults.buttonColors(containerColor = Color(0xFFE0E0E0)),
                shape = RoundedCornerShape(4.dp),
                border = BorderStroke(2.dp, Color(0xFF1A1A1A)),
                contentPadding = PaddingValues(horizontal = 14.dp, vertical = 6.dp)
            ) {
                Row(verticalAlignment = Alignment.CenterVertically) {
                    Icon(
                        imageVector = if (isFa) Icons.Default.ArrowForward else Icons.Default.ArrowBack,
                        contentDescription = "Back",
                        tint = Color(0xFF1A1A1A),
                        modifier = Modifier.size(16.dp)
                    )
                    Spacer(modifier = Modifier.width(6.dp))
                    Text(strings.back, color = Color(0xFF1A1A1A), fontSize = 14.sp, fontWeight = FontWeight.Bold)
                }
            }
        }

        Text(
            text = strings.material,
            fontSize = 24.sp,
            fontWeight = FontWeight.Black,
            modifier = Modifier.padding(bottom = 12.dp)
        )

        Text(
            text = strings.materialDesc,
            fontSize = 16.sp,
            color = Color.DarkGray,
            lineHeight = 24.sp
        )

        Spacer(modifier = Modifier.height(24.dp))

        Button(
            onClick = {
                val browserIntent = Intent(Intent.ACTION_VIEW, Uri.parse("https://www.paypal.com/paypalme/sobhanganji"))
                context.startActivity(browserIntent)
            },
            colors = ButtonDefaults.buttonColors(containerColor = Color(0xFF1A1A1A)),
            shape = RoundedCornerShape(4.dp),
            modifier = Modifier
                .fillMaxWidth()
                .height(54.dp)
                .border(2.dp, Color(0xFF1A1A1A))
        ) {
            Text(strings.donate, fontWeight = FontWeight.Bold, color = Color.White)
        }
    }
}

// MARK: - API Connection Helper

fun callLogicalAnalyzeAPI(text: String, lang: String): List<FallacyItem> {
    val endpoint = "https://ais-pre-6jzd7w3qbss3l53dcxvvz2-18944585449.europe-west3.run.app/api/analyze"
    val url = URL(endpoint)
    val conn = url.openConnection() as HttpURLConnection
    conn.requestMethod = "POST"
    conn.setRequestProperty("Content-Type", "application/json; charset=utf-8")
    conn.doOutput = true
    conn.connectTimeout = 12000
    conn.readTimeout = 12000

    val payload = mapOf("text" to text, "lang" to lang)
    val jsonPayload = Gson().toJson(payload)

    conn.outputStream.use { os ->
        OutputStreamWriter(os, "UTF-8").use { osw ->
            osw.write(jsonPayload)
            osw.flush()
        }
    }

    if (conn.responseCode == HttpURLConnection.HTTP_OK) {
        val responseText = conn.inputStream.bufferedReader().use { it.readText() }
        val gson = Gson()
        val type = object : TypeToken<Map<String, List<FallacyItem>>>() {}.type
        val result: Map<String, List<FallacyItem>> = gson.fromJson(responseText, type)
        return result["analysis"] ?: emptyList()
    } else {
        val errResponse = conn.errorStream?.bufferedReader()?.use { it.readText() }
        if (errResponse != null) {
            val type = object : TypeToken<Map<String, String>>() {}.type
            val errorObj: Map<String, String>? = try { Gson().fromJson(errResponse, type) } catch (e: Exception) { null }
            if (errorObj != null && errorObj.containsKey("error")) {
                throw Exception(errorObj["error"])
            }
        }
        throw Exception("Server replied with code ${conn.responseCode}")
    }
}
