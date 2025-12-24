#!/usr/bin/env python3
"""
泉州感染防止ネットワーク手指衛生直接観察用フォーム PDF生成スクリプト
"""

from reportlab.lib.pagesizes import A4
from reportlab.lib.units import mm, pt
from reportlab.pdfgen import canvas
from reportlab.lib import colors
from reportlab.platypus import Table, TableStyle, Paragraph, Spacer, PageBreak, SimpleDocTemplate
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.enums import TA_CENTER, TA_LEFT, TA_RIGHT
from datetime import datetime
from typing import List, Dict, Any
import json
import sys
import io

# 5つのタイミング情報
TIMINGS = {
    1: {"name": "患者接触前", "description": "患者に接触する前"},
    2: {"name": "清潔/無菌操作前", "description": "清潔/無菌操作の前"},
    3: {"name": "体液曝露後", "description": "体液曝露の可能性のある場合"},
    4: {"name": "患者接触後", "description": "患者に接触した後"},
    5: {"name": "患者周辺物品接触後", "description": "患者周辺物品に接触した後"},
}

# アクション情報
ACTIONS = {
    "hand_sanitizer": "手指消毒",
    "hand_wash": "手洗い",
    "no_action": "実施なし",
}


class ObservationFormPDF:
    """泉州感染防止ネットワーク手指衛生直接観察用フォームPDF生成クラス"""

    def __init__(self, output_path: str):
        self.output_path = output_path
        self.page_width, self.page_height = A4
        self.margin = 10 * mm

    def generate(self, facility_info: Dict[str, str], records: List[Dict[str, Any]]) -> str:
        """
        PDFを生成して保存
        
        Args:
            facility_info: 施設情報（施設名、部局、病棟、科、観察者など）
            records: 記録データのリスト
            
        Returns:
            生成されたPDFファイルのパス
        """
        c = canvas.Canvas(self.output_path, pagesize=A4)
        
        # ページ設定
        c.setFont("HeiseiKakuGo-W5", 16)
        
        # タイトル
        title = "泉州感染防止ネットワーク手指衛生直接観察用フォーム"
        c.drawCentredString(self.page_width / 2, self.page_height - 20 * mm, title)
        
        # 小タイトル
        c.setFont("HeiseiKakuGo-W5", 10)
        c.drawCentredString(self.page_width / 2, self.page_height - 28 * mm, "観察フォーム")
        
        # ヘッダー情報を描画
        y_position = self.page_height - 35 * mm
        y_position = self._draw_header_info(c, facility_info, y_position)
        
        # 観察テーブルを描画
        y_position = self._draw_observation_table(c, records, y_position)
        
        # フッター
        c.setFont("HeiseiKakuGo-W5", 8)
        c.drawRightString(self.page_width - 10 * mm, 10 * mm, "WHO観察フォーム一部変換")
        
        c.save()
        return self.output_path

    def _draw_header_info(self, c: canvas.Canvas, facility_info: Dict[str, str], y_start: float) -> float:
        """ヘッダー情報を描画"""
        c.setFont("HeiseiKakuGo-W5", 9)
        
        # ヘッダーフィールド
        fields = [
            ("施設名:", facility_info.get("facilityName", "")),
            ("部局:", facility_info.get("department", "")),
            ("病棟:", facility_info.get("ward", "")),
            ("科:", facility_info.get("section", "")),
            ("期間番号:", facility_info.get("periodNumber", "")),
            ("日付 (dd/mm/yy):", facility_info.get("date", "")),
            ("セッション番号:", facility_info.get("sessionNumber", "")),
            ("観察者 (initials):", facility_info.get("observer", "")),
            ("ページ№:", facility_info.get("pageNumber", "")),
            ("住所:", facility_info.get("address", "")),
        ]
        
        # 2列レイアウト
        line_height = 5 * mm
        x_left = self.margin
        x_right = self.page_width / 2 + 5 * mm
        
        for i, (label, value) in enumerate(fields):
            if i % 2 == 0:
                x = x_left
                y = y_start - (i // 2) * line_height
            else:
                x = x_right
                y = y_start - ((i - 1) // 2) * line_height
            
            # ラベル
            c.drawString(x, y, label)
            
            # 値（下線付き）
            c.line(x + 25 * mm, y - 1 * mm, x + 60 * mm, y - 1 * mm)
            if value:
                c.drawString(x + 26 * mm, y - 2 * mm, str(value))
        
        return y_start - 6 * line_height

    def _draw_observation_table(self, c: canvas.Canvas, records: List[Dict[str, Any]], y_start: float) -> float:
        """観察テーブルを描画"""
        c.setFont("HeiseiKakuGo-W5", 8)
        
        # テーブルの開始位置
        y = y_start - 10 * mm
        table_width = self.page_width - 2 * self.margin
        col_width = table_width / 4
        row_height = 8 * mm
        
        # ヘッダー行
        c.setFillColorRGB(0.93, 0.84, 0.75)  # ベージュ色
        c.rect(self.margin, y - row_height, table_width, row_height, fill=1)
        
        # ヘッダーテキスト
        c.setFont("HeiseiKakuGo-W5", 7)
        headers = ["機会", "適応", "手指衛生", "機会"]
        for i, header in enumerate(headers):
            x = self.margin + i * col_width + 2 * mm
            c.drawString(x, y - row_height + 2 * mm, header)
        
        y -= row_height
        
        # 記録データを日付別にグループ化
        records_by_date = {}
        for record in records:
            date_key = datetime.fromtimestamp(record.get("timestamp", 0) / 1000).strftime("%Y-%m-%d")
            if date_key not in records_by_date:
                records_by_date[date_key] = []
            records_by_date[date_key].append(record)
        
        # セッション番号（最大8）
        session_num = 0
        for date_key in sorted(records_by_date.keys())[:8]:
            session_records = records_by_date[date_key]
            session_num += 1
            
            # 5つのタイミングの行を描画
            for timing in range(1, 6):
                timing_records = [r for r in session_records if r.get("timing") == timing]
                
                # 背景色（ピンク系）
                c.setFillColorRGB(1.0, 0.96, 0.94)  # 薄いピンク
                c.rect(self.margin, y - row_height, table_width, row_height, fill=1)
                
                # セッション番号とタイミング
                c.setFont("HeiseiKakuGo-W5", 7)
                timing_info = TIMINGS.get(timing, {})
                timing_text = f"{session_num}. {timing_info.get('name', '')}"
                c.drawString(self.margin + 2 * mm, y - row_height + 2 * mm, timing_text)
                
                # 適応状況
                applicable = "☑" if timing_records else "☐"
                c.drawString(self.margin + col_width + 2 * mm, y - row_height + 2 * mm, applicable)
                
                # 手指衛生実施内容
                actions = []
                for record in timing_records:
                    action = record.get("action", "")
                    if action == "hand_sanitizer":
                        actions.append("☑手指消毒")
                    elif action == "hand_wash":
                        actions.append("☑手洗い")
                    elif action == "no_action":
                        actions.append("☑実施なし")
                
                if not actions:
                    actions = ["☐手指消毒", "☐手洗い", "☐実施なし"]
                
                action_text = " ".join(actions[:2])  # 最初の2つを表示
                c.drawString(self.margin + 2 * col_width + 2 * mm, y - row_height + 2 * mm, action_text)
                
                # 罫線
                c.setStrokeColorRGB(0.7, 0.7, 0.7)
                c.rect(self.margin, y - row_height, table_width, row_height)
                
                y -= row_height
        
        return y

    def generate_from_json(self, json_data: str) -> str:
        """
        JSON形式のデータからPDFを生成
        
        Args:
            json_data: JSON形式の文字列
            
        Returns:
            生成されたPDFファイルのパス
        """
        data = json.loads(json_data)
        facility_info = data.get("facilityInfo", {})
        records = data.get("records", [])
        
        return self.generate(facility_info, records)


def main():
    """メイン関数"""
    if len(sys.argv) < 3:
        print("Usage: python pdf_generator.py <output_path> <json_data>")
        sys.exit(1)
    
    output_path = sys.argv[1]
    json_data = sys.argv[2]
    
    try:
        generator = ObservationFormPDF(output_path)
        result_path = generator.generate_from_json(json_data)
        print(json.dumps({"success": True, "path": result_path}))
    except Exception as e:
        print(json.dumps({"success": False, "error": str(e)}))
        sys.exit(1)


if __name__ == "__main__":
    main()
