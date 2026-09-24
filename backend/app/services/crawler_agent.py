"""
crawler_agent.py - Trình thu thập, phân loại và chuẩn hóa tư liệu di sản phục trang Việt Nam.
Dự án: Việt Phục Remix (VietStyle AI)
"""

import os
import sys
import time
import json
import logging
import urllib.parse
import requests
from pathlib import Path
from PIL import Image
from io import BytesIO

# Cấu hình logging
logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s")
logger = logging.getLogger(__name__)

HEADERS = {
    "User-Agent": "VietPhucRemixHeritageApp/1.0 (https://github.com/vietphucremix; contact@vietphucremix.vn) python-requests/2.31"
}

def make_commons_redirect_url(filename: str, width: int = 1200) -> str:
    """Tạo link chuyển hướng Wikimedia Commons ổn định với độ phân giải tùy chỉnh."""
    safe_filename = urllib.parse.quote(filename.replace("File:", "").strip())
    return f"https://commons.wikimedia.org/wiki/Special:Redirect/file/{safe_filename}?width={width}"

# Danh mục di sản phục trang Việt Nam chuẩn hóa
COSTUMES_DATA = [
    {
        "id": "ao-giao-linh",
        "name": "Áo Giao Lĩnh (Trực Lĩnh)",
        "era_origin": "Thời Lý - Trần - Lê (TK XI - XVIII)",
        "era_code": "LY_TRAN_LE",
        "category_type": "GIAO_LINH",
        "collar_type": "Giao lĩnh (Cổ chéo nẹp viền)",
        "sleeve_type": "Tay thụng rộng (Bác tụ / Chấn tụ)",
        "panel_count": 4,
        "region": "Bắc Bộ (Kinh đô Thăng Long)",
        "ethnicity": "Kinh",
        "significance": "Biểu tượng đỉnh cao của nền văn hiến Đại Việt độc lập, giao thoa giữa tư tưởng Phật giáo và Nho giáo. Tà áo rộng thênh thang thể hiện cốt cách ung dung, hào sảng của Hào khí Đông A và thời kỳ thái bình thịnh trị thời Lê Sơ.",
        "standard_materials": "Lụa tơ tằm Vạn Phúc, Gấm dệt vân mây, Đũi thô tự nhiên",
        "color_symbolism": "Màu chàm trầm, màu cánh kiến, xanh lam đậm, viền cổ nẹp vải màu tương phản tạo điểm nhấn hình học",
        "occasion_usage": "Đại lễ triều đình, tế tự tông miếu, lễ đăng khoa, sĩ tử ứng thí thời phong kiến",
        "design_rules": "Cổ áo khoét vạt chéo đè lên nhau, vạt bên hữu (phải) đè lên vạt tả (trái). Tuyệt đối không may ngược vạt sang tả (kiểu tang phục xưa). Khổ tay rộng tối thiểu 40-60cm buông dài qua gối.",
        "cultural_guardrails": {
            "critical_rules": [
                "Vạt áo bắt buộc cài bên hữu (bên phải). Không cài vạt sang trái.",
                "Tránh dùng chất liệu voan/lưới xuyên thấu làm mất đi vẻ kín đáo thâm nghiêm của nghi lễ xưa."
            ],
            "curator_note": "Áo Giao Lĩnh cổ xưa luôn có lớp trung đơn (áo lót trắng bên trong) lộ nhẹ phần cổ để phân tách lớp trang phục và giữ vệ sinh cho lớp áo gấm bên ngoài."
        },
        "remix_suggestions": {
            "concept_name": "Modern Minimalist Overcoat",
            "ratio": {"traditional": 60, "contemporary": 30, "accessories": 10},
            "formula": "Khoác Áo Giao Lĩnh lụa mộc buông mở tà + Áo thun cổ lọ ôm sát + Quần tây ống suông (Wide-leg trousers) + Giày Chelsea boots hoặc Loafer da bóng.",
            "suitable_for": "Đi triển lãm nghệ thuật, cà phê sách, sự kiện văn hóa nghệ thuật đương đại."
        },
        "wiki_files": {
            "cover": "Áo giao lĩnh postcard.jpg",
            "gallery": [
                "Trần Nhân Tông TLĐSXSCĐ.png",
                "Lord Nguyen Phuc Thuan.jpg"
            ]
        }
    },
    {
        "id": "ao-vien-linh",
        "name": "Áo Viên Lĩnh (Áo Cổ Tròn / Bù Xích)",
        "era_origin": "Thời Hậu Lê - Nguyễn (TK XV - XIX)",
        "era_code": "LE_NGUYEN",
        "category_type": "VIEN_LINH",
        "collar_type": "Viên lĩnh (Cổ tròn khép kín viền viền tròn)",
        "sleeve_type": "Tay thụng vừa hoặc tay chẽn",
        "panel_count": 4,
        "region": "Bắc Bộ & Trung Bộ",
        "ethnicity": "Kinh",
        "significance": "Trang phục quan chức, quý tộc và hoàng gia trong các sinh hoạt công vụ triều đình. Biểu trưng cho sự viên mãn, trời tròn đất vuông theo quan niệm triết học phương Đông.",
        "standard_materials": "Lụa gấm sa đoạn, vân mây, the Nam Định nhuộm thủ công",
        "color_symbolism": "Màu xanh bích, đỏ tía (bổ tử chim ngỗng/phượng), vàng đất hoàng gia",
        "occasion_usage": "Thiết triều thường nhật, yến tiệc, giao tế ngoại giao, vinh quy bái tổ",
        "design_rules": "Cổ áo tròn khép kín ôm chân cổ, cài nút ngọc/đồng bên vai phải, ngực thường đính bổ tử (hình thêu phẩm trật).",
        "cultural_guardrails": {
            "critical_rules": [
                "Bổ tử (hình vuông thêu trước ngực) phải đúng phẩm cấp văn võ (văn quan thêu chim, võ quan thêu thú).",
                "Không in bừa bãi hoa văn rồng 5 móng (biểu tượng độc quyền của Hoàng đế)."
            ],
            "curator_note": "Áo Viên Lĩnh có phom suông rộng rãi, mang vẻ uy nghi đĩnh đạc nhưng vẫn rất thanh thoát khi di chuyển."
        },
        "remix_suggestions": {
            "concept_name": "Heritage Tailored Tunic",
            "ratio": {"traditional": 60, "contemporary": 30, "accessories": 10},
            "formula": "Áo Viên Lĩnh rút ngắn vạt (dáng tunic lửng) + Quần lụa ống suông đồng màu + Kiềng bạc chạm khắc mỏng + Túi xách da thủ công.",
            "suitable_for": "Sự kiện thời trang, dạ tiệc cao cấp mang phong cách Á Đông hiện đại."
        },
        "wiki_files": {
            "cover": "Nguyen Trai.jpg",
            "gallery": [
                "Nguyen Dynasty Clothing (9980925493).jpg"
            ]
        }
    },
    {
        "id": "ao-tac",
        "name": "Áo Tấc (Áo Ngũ Thân Tay Thụng)",
        "era_origin": "Thời Chúa Nguyễn & Triều Nguyễn (1744 - 1945)",
        "era_code": "NGUYEN_DYNASTY",
        "category_type": "NGU_THAN",
        "collar_type": "Lập lĩnh (Cổ đứng tròn khép kín)",
        "sleeve_type": "Tay thụng rộng (Dài bằng tà áo hoặc qua ngón tay)",
        "panel_count": 5,
        "region": "Toàn quốc (Kinh đô Phú Xuân - Huế làm chuẩn mực)",
        "ethnicity": "Kinh",
        "significance": "Đại lễ phục dân tộc chuẩn mực nhất của người Việt dưới triều Nguyễn. Mang tính bình đẳng xã hội: từ bậc quân vương, quan lại cho đến thứ dân trăm họ đều mặc áo tấc trong các dịp lễ nghi trọng đại của đời người.",
        "standard_materials": "Lụa tơ tằm Hà Đông, Gấm hoa chìm, Sa, The Cố đô",
        "color_symbolism": "Màu xanh lam, màu đỏ son, cánh gián, vàng đồng quý phái",
        "occasion_usage": "Hôn lễ (chú rể & cô dâu), Lễ tế trời đất, Chúc thọ ông bà cha mẹ, Lễ Tết nguyên đán",
        "design_rules": "Cổ đứng lập lĩnh cao 3-4cm, 5 thân áo ráp nối khéo léo (4 thân ngoài, 1 thân con bên trong), 5 chiếc khuy kim loại/ngọc cài vạt hữu, tay áo buông rộng hình chữ nhật đo đúng 1 tấc (khoảng 30-40cm).",
        "cultural_guardrails": {
            "critical_rules": [
                "Áo Tấc là lễ phục, khi mặc bắt buộc phải đi kèm khăn đóng (khăn vấn) và quần trắng lụa ống rộng.",
                "Hai tay khi đứng nghiêm trang phải chắp trước bụng để hai ống tay thụng phủ rũ cân đối."
            ],
            "curator_note": "Ý nghĩa 5 thân áo: Bốn thân ngoài tượng trưng cho 'Tứ thân phụ mẫu' (cha mẹ đẻ và cha mẹ chồng/vợ), thân nhỏ thứ năm lót bên trong che chở tượng trưng cho chính người mặc; năm hạt khuy tượng trưng cho 'Ngũ thường' (Nhân, Nghĩa, Lễ, Trí, Tín)."
        },
        "remix_suggestions": {
            "concept_name": "Royal Ceremony x Contemporary Chic",
            "ratio": {"traditional": 60, "contemporary": 30, "accessories": 10},
            "formula": "Áo Tấc gấm đỏ son thêu hoa văn ẩn + Quần culottes trắng kem + Vòng cổ ngọc trai nhiều tầng + Giày mule cao gót nhung mũi nhọn.",
            "suitable_for": "Lễ cưới hiện đại, chụp ảnh lookbook kỷ yếu, đại tiệc ngoại giao văn hóa."
        },
        "wiki_files": {
            "cover": "Áo tấc bát bảo mãng bào.jpeg",
            "gallery": [
                "Ấu học ngũ ngôn thi còn gọi là Trạng nguyên thi bản khắc vào giữa mùa thu năm Tự Đức thứ 16 (1863) 01.jpg"
            ]
        }
    },
    {
        "id": "ao-ngu-than-tay-chen",
        "name": "Áo Ngũ Thân Tay Chẽn",
        "era_origin": "Thời Chúa Nguyễn Phúc Khoát đến thời Nguyễn (1744 - TK XX)",
        "era_code": "NGUYEN_DYNASTY",
        "category_type": "NGU_THAN",
        "collar_type": "Lập lĩnh (Cổ đứng truyền thống khép kín)",
        "sleeve_type": "Tay chẽn (Ôm vừa vặn từ bắp tay đến cổ tay)",
        "panel_count": 5,
        "region": "Toàn quốc (Bắc - Trung - Nam)",
        "ethnicity": "Kinh",
        "significance": "Tiền thân trực tiếp của Áo Dài Việt Nam ngày nay. Là trang phục thường nhật của sĩ phu, nhà buôn và thường dân, mang vẻ đẹp mực thước, kín đáo, đoan trang và tôn dáng tự nhiên của người Á Đông.",
        "standard_materials": "Lụa tơ tằm, Đũi, Đạm, Xuyên lụa, The mỏng nhẹ",
        "color_symbolism": "Màu xanh lục nhạt, nâu tro, trắng ngà, xanh chàm mực nho",
        "occasion_usage": "Đi học, dạy học, công sở xưa, dạo phố, gặp gỡ giao tế thường nhật",
        "design_rules": "Cổ đứng nghiêm cẩn 3-4cm, tà áo xòe nhẹ hình chữ A lượn sóng tự nhiên (tà cong), thân áo may bằng 5 mảnh ghép khéo léo đường kim giấu mối tinh xảo.",
        "cultural_guardrails": {
            "critical_rules": [
                "Vạt áo cài bằng 5 nút khuy chéo từ chân cổ qua nách xuống sườn phải.",
                "Không nên chiết eo quá bó sát kiểu áo dài Tây hóa 1960 vì sẽ phá vỡ phom dáng suông nhẹ nhàng quý phái đặc trưng của ngũ thân."
            ],
            "curator_note": "Khác với áo dài hiện đại chiết eo bó sát, áo ngũ thân tay chẽn có phom suông chữ A nhẹ nhàng, tạo sự thoải mái tối đa cho cử động nhưng vẫn giữ phong thái đĩnh đạc."
        },
        "remix_suggestions": {
            "concept_name": "Urban Intellectual Streetwear",
            "ratio": {"traditional": 60, "contemporary": 30, "accessories": 10},
            "formula": "Áo Ngũ Thân Tay Chẽn tone chàm mộc + Quần âu ống rộng xếp ly (Wide Pleated Trousers) + Giày da Loafer hoặc Sneaker trắng tối giản + Mắt kính gọng tròn cổ điển.",
            "suitable_for": "Thuyết trình giảng đường đại học, làm việc tại Creative Agency, dạo phố cuối tuần."
        },
        "wiki_files": {
            "cover": "Áo dài 襖𨱽.png",
            "gallery": [
                "Ấu học ngũ ngôn thi còn gọi là Trạng nguyên thi bản khắc vào giữa mùa thu năm Tự Đức thứ 16 (1863) 02.jpg"
            ]
        }
    },
    {
        "id": "ao-nhat-binh",
        "name": "Áo Nhật Bình",
        "era_origin": "Thời Triều Nguyễn (1802 - 1945)",
        "era_code": "NGUYEN_DYNASTY",
        "category_type": "NHAT_BINH",
        "collar_type": "Cổ vuông chữ nhật viền nẹp bản lớn (Nhật Bình)",
        "sleeve_type": "Tay thụng viền dải ngũ sắc (Ngũ hành sinh khắc)",
        "panel_count": 4,
        "region": "Kinh thành Huế (Hoàng cung triều Nguyễn)",
        "ethnicity": "Kinh",
        "significance": "Đặc trưng lễ phục tối thượng của Hoàng Hậu, Công Chúa và Cung tần quý tộc triều Nguyễn. Hoa văn thêu tay tinh xảo với biểu tượng phượng hoàng, sóng nước thủy ba, bát bửu tượng trưng cho phẩm hạnh đoan trang và vương quyền.",
        "standard_materials": "Gấm đoạn chính thống, Sa dệt chỉ vàng kim tuyến, Lụa tơ tằm thêu tay",
        "color_symbolism": "Màu vàng chính hoàng (Hoàng hậu), Đỏ son hồng xích (Công chúa), Tím hoa cà (Cung tần tam giai)",
        "occasion_usage": "Đại lễ tấn phong, Hôn lễ hoàng tộc, Lễ khánh tiết triều đình, Dạ yến cung đình",
        "design_rules": "Cổ áo khoét hình chữ nhật lớn chạy dọc từ cổ xuống ngực, hai bên nẹp cổ thêu hoa văn chỉ vàng đối xứng, cổ tay áo có dải viền ngũ sắc (xanh, vàng, trắng, đỏ, đen) theo thuyết Ngũ Hành.",
        "cultural_guardrails": {
            "critical_rules": [
                "Màu vàng chính sắc (Chính hoàng) theo điển chế là màu độc quyền của Hoàng Thái Hậu và Hoàng Hậu.",
                "Hai dải thắt lưng ngũ sắc buông thả phía trước ngực phải cân đối, cài trâm cài tóc hoặc khăn vành dây chuẩn mực."
            ],
            "curator_note": "Cái tên 'Nhật Bình' xuất phát từ phần nẹp cổ to bản ghép lại trước ngực tạo thành một hình chữ nhật phẳng phiu, trang nghiêm."
        },
        "remix_suggestions": {
            "concept_name": "Imperial Statement Couture",
            "ratio": {"traditional": 60, "contemporary": 30, "accessories": 10},
            "formula": "Áo Nhật Bình thêu cách điệu khoác hờ như Kimono/Duster Coat + Áo yếm lụa trắng trơn bên trong + Quần lụa ống suông đen tuyền + Khuyên tai ngọc trai giọt nước.",
            "suitable_for": "Sự kiện thảm đỏ, biểu diễn văn hóa nghệ thuật, lễ cưới sang trọng."
        },
        "wiki_files": {
            "cover": "Vietnamese woman wearing Áo Nhật Bình.jpg",
            "gallery": [
                "Portrait of Empress Nam Phuong during her Wedding Day, 1934.jpg",
                "Bảo Đại & Nam Phương.jpg"
            ]
        }
    },
    {
        "id": "ao-tu-than",
        "name": "Áo Tứ Thân & Yếm Đào",
        "era_origin": "Thời kỳ Phong kiến đến đầu Thế kỷ XX",
        "era_code": "DAN_GIAN",
        "category_type": "TU_THAN",
        "collar_type": "Không cổ / Cổ yếm đào kết hợp vạt mở",
        "sleeve_type": "Tay chẽn lửng tiện cử động",
        "panel_count": 4,
        "region": "Đồng bằng Bắc Bộ (Kinh Bắc - Hà Bắc xưa)",
        "ethnicity": "Kinh",
        "significance": "Hồn cốt của phụ nữ nông thôn và thị dân miền Bắc. Gắn liền với các làn điệu Quan họ đằm thắm, hình ảnh nón quai thao, dải thắt lưng lụa đào bay trong gió hội mùa xuân.",
        "standard_materials": "Vải đũi nhuộm bùn, Vải sồi nhuộm củ nâu, Lụa nõn chuối, Tơ tằm thô",
        "color_symbolism": "Áo ngoài màu nâu non hoặc đen chàm, bên trong là yếm đào (hồng thắm) hoặc yếm cánh sen, thắt lưng xanh màu lá mạ",
        "occasion_usage": "Hội Lim, Hội đền Hùng, Lễ hội dân gian đầu xuân, hát Quan họ giao duyên, sinh hoạt làng quê",
        "design_rules": "Hai thân sau may liền sống lưng thành một đường thẳng thon dài, hai vạt trước để buông tự do hoặc buộc vạt trước bụng để tiện gánh gồng làm việc.",
        "cultural_guardrails": {
            "critical_rules": [
                "Áo Tứ Thân truyền thống mặc mở ngực để khoe đường cong lấp ló thanh tao của chiếc Áo Yếm bên trong.",
                "Tránh cách tân hở hang quá đà hoặc mặc yếm không có lớp áo tứ thân che chắn ở chốn tâm linh đình chùa."
            ],
            "curator_note": "Chiếc Áo Yếm đào đóng vai trò như đồ lót và nội y tao nhã của người phụ nữ Việt cổ xưa, kết hợp cùng áo tứ thân ngoài tạo nên sự duyên dáng kín đáo đầy ý nhị."
        },
        "remix_suggestions": {
            "concept_name": "Folk Romance Bohemian",
            "ratio": {"traditional": 60, "contemporary": 30, "accessories": 10},
            "formula": "Áo Yếm lụa tơ tằm thêu hoa sen tối giản + Áo khoác Tứ Thân vải đũi mộc buông tà + Chân váy xếp ly lụa xòe dài + Guốc mộc quai da hiện đại.",
            "suitable_for": "Lễ hội âm nhạc mùa hè, du lịch cố đô, dã ngoại làng cổ Đường Lâm."
        },
        "wiki_files": {
            "cover": "Woman's garment, traditional Viet - Vietnam Museum of Ethnology - Hanoi, Vietnam - DSC02552.JPG",
            "gallery": [
                "Áo tứ thân.jpg",
                "Áo tứ thân 1.jpg"
            ]
        }
    },
    {
        "id": "ao-ba-ba",
        "name": "Áo Bà Ba & Khăn Rằn",
        "era_origin": "Thời kỳ Khai phá Miền Nam (TK XIX - XX)",
        "era_code": "NAM_BO",
        "category_type": "BA_BA",
        "collar_type": "Cổ giữa (Cổ tròn khoét nhẹ hoặc cổ tim không lá)",
        "sleeve_type": "Tay dài ôm nhẹ, tà xẻ hông cao",
        "panel_count": 2,
        "region": "Nam Bộ (Đồng bằng Sông Cửu Long)",
        "ethnicity": "Kinh",
        "significance": "Biểu tượng của tính cách hào sảng, chất phác, thật thà và can trường của người phương Nam. Gắn bó keo sơn với đời sống sông nước miệt vườn và lịch sử quật khởi.",
        "standard_materials": "Vải lụa mỡ gà, Gấm hoa xốp, Vải chéo nhuộm lá bàng, Vải tôn mát mịn",
        "color_symbolism": "Màu đen trơn, nâu vỏ dà (lao động) hoặc màu mỡ gà, hồng phấn, xanh ngọc (dạo chơi)",
        "occasion_usage": "Chợ nổi sông nước, đờn ca tài tử, lễ hội trái cây, sinh hoạt miền Tây sông nước",
        "design_rules": "Thân áo chắp từ hai mảnh trước và một mảnh lưng sau, xẻ tà hai bên hông cao tới eo tạo sự thoáng mát và cử động chèo ghe thuận tiện. Phía trước có hai túi nhỏ.",
        "cultural_guardrails": {
            "critical_rules": [
                "Quần đi kèm áo bà ba truyền thống luôn là quần lụa đen hoặc trắng ống suông rộng.",
                "Khăn rằn sọc ca-rô đen trắng quấn cổ hoặc thắt đầu là phụ kiện bất ly thân định danh nét văn hóa sông nước."
            ],
            "curator_note": "Tên gọi 'Bà Ba' có giả thuyết xuất phát từ trang phục của người Ba Ba (người Peranakan gốc Hoa ở Malaysia/Singapore) du nhập vào miền Nam rồi được Việt hóa hoàn toàn."
        },
        "remix_suggestions": {
            "concept_name": "Mekong Breeze Casual",
            "ratio": {"traditional": 60, "contemporary": 30, "accessories": 10},
            "formula": "Áo Bà Ba lụa tơ pastel form rộng phóng khoáng + Quần Jean ống rộng cạp cao + Túi cói lục bình đan thủ công + Khăn rằn vắt hờ trên vai.",
            "suitable_for": "Du lịch sinh thái, picnic cuối tuần, phong cách thời trang nghỉ dưỡng Resort Wear."
        },
        "wiki_files": {
            "cover": "Costume Ba ba, Viet, Ben Tre, 1968, industrial fabric - Vietnamese Women's Museum - Hanoi, Vietnam - DSC04104.JPG",
            "gallery": [
                "Peasant in áo bà ba.jpg"
            ]
        }
    },
    {
        "id": "ao-dai-lemur-le-pho",
        "name": "Áo Dài Lemur & Lê Phổ (Cách Tân 1930)",
        "era_origin": "Thời kỳ Mỹ thuật Đông Dương (1930 - 1954)",
        "era_code": "TAN_THOI",
        "category_type": "AO_DAI_CACH_TAN",
        "collar_type": "Cổ lá sen, Cổ khoét tròn hoặc cổ tim Tây phương",
        "sleeve_type": "Tay bồng nhún vai kiểu quý tộc Paris hoặc tay lửng",
        "panel_count": 2,
        "region": "Hà Nội & Sài Gòn đô thị",
        "ethnicity": "Kinh",
        "significance": "Cuộc cách mạng thời trang chấn động của nhóm Tự Lực Văn Đoàn và các họa sĩ Trường Mỹ thuật Đông Dương (Cát Tường - Lemur, Lê Phổ). Lần đầu tiên trang phục Việt Nam tôn vinh đường cong cơ thể người phụ nữ với sự tự tin hiện đại.",
        "standard_materials": "Lụa tơ sống Hà Đông, Satin ngoại nhập, Voan hoa mỏng nhẹ",
        "color_symbolism": "Màu pastel nhạt: vàng mơ, hồng phấn, xanh lơ, trắng ngà quý phái",
        "occasion_usage": "Dạo phố Tràng Tiền, dạ vũ, triển lãm tranh, tiệc salon trí thức Hà Thành",
        "design_rules": "Thân áo ôm sát đường cong ngực và eo, tà áo buông rủ dài gần chạm gót, tay phồng nhún nhẹ ở vai, viền ren tinh tế kiểu Pháp.",
        "cultural_guardrails": {
            "critical_rules": [
                "Cần phân biệt giữa cách tân thanh lịch của họa sĩ Cát Tường/Lê Phổ với các biến tướng phản cảm hở hang thời nay.",
                "Trang phục mang đậm dấu ấn giao lưu văn hóa Pháp - Việt, giữ vững nét thanh tao của thiếu nữ Hà thành xưa."
            ],
            "curator_note": "Họa sĩ Lê Phổ sau đó đã giản lược bớt các chi tiết Tây hóa quá đà của Lemur để đưa chiếc áo dài về gần gũi hơn với tâm thức Việt, đặt nền móng cho chiếc áo dài duyên dáng ngày nay."
        },
        "remix_suggestions": {
            "concept_name": "Indochine Vintage Romance",
            "ratio": {"traditional": 60, "contemporary": 30, "accessories": 10},
            "formula": "Áo Dài Lemur tay bồng lụa tơ tằm hoa nhí + Quần lụa trắng ngà ống rộng + Kính mắt mèo vintage + Băng đô nhung cài tóc + Giày Mary Jane.",
            "suitable_for": "Chụp ảnh phong cách hoài cổ Indochine, tiệc trà chiều, sự kiện văn học nghệ thuật."
        },
        "wiki_files": {
            "cover": "ao-dai-sample.png",
            "gallery": [
                "Ao Dai (modern).jpg"
            ]
        }
    },
    {
        "id": "trang-phuc-hmong-hoa",
        "name": "Trang Phục Dân Tộc H'Mông Hoa",
        "era_origin": "Di sản Văn hóa Dân tộc Bản địa Vùng Cao",
        "era_code": "ETHNIC_HERITAGE",
        "category_type": "THO_CAM_DAN_TOC",
        "collar_type": "Cổ chữ V xẻ ngực nẹp thổ cẩm thêu tay",
        "sleeve_type": "Tay áo phối nhiều tầng hoa văn rực rỡ",
        "panel_count": 2,
        "region": "Vùng núi cao Tây Bắc (Hà Giang, Lào Cai, Sơn La)",
        "ethnicity": "H'Mông (Mông Hoa)",
        "significance": "Kiệt tác nghệ thuật dệt may thủ công của người vùng cao. Váy xòe xếp ly nếp gấp hình cánh chim bay lượn, kỹ thuật vẽ hoa văn sáp ong (Batik) và thêu chỉ màu tinh xảo lưu giữ vũ trụ quan và bản sắc kiên cường giữa đại ngàn.",
        "standard_materials": "Vải lanh dệt tay, Nhuộm chàm tự nhiên, Sáp ong rừng, Chỉ tơ nhuộm thảo mộc",
        "color_symbolism": "Màu chàm đen làm nền, hoa văn hình học màu đỏ, cam, vàng, lục tương phản rực rỡ",
        "occasion_usage": "Chợ phiên Bắc Hà, Lễ hội Gầu Tào, Tết Nào Pê Chầu, lễ dạm ngõ kết duyên",
        "design_rules": "Váy hình nón cụt xếp hàng trăm nếp ly tinh xảo, đai lưng thổ cẩm bản lớn thắt eo, tạp dề yếm che trước và sau, xà cạp quấn bắp chân vững chãi.",
        "cultural_guardrails": {
            "critical_rules": [
                "Hoa văn vẽ sáp ong và hoa văn thêu là linh hồn mang ký hiệu tổ tiên của người Mông, không đảo lộn hình thù linh thiêng.",
                "Bộ trang sức bạc (kiềng bạc chạm khắc hình rồng/mặt trời) tượng trưng cho sự no ấm và trừ tà khí."
            ],
            "curator_note": "Một chiếc váy lanh H'Mông Hoa truyền thống cần từ 6 tháng đến 1 năm ròng rã của người phụ nữ để hoàn thành từ khâu tước sợi lanh, dệt, vẽ sáp ong đến thêu chỉ."
        },
        "remix_suggestions": {
            "concept_name": "Highland Tribal Statement",
            "ratio": {"traditional": 60, "contemporary": 30, "accessories": 10},
            "formula": "Áo khoác lửng thổ cẩm H'Mông Hoa dệt tay + Áo croptop đen trơn + Quần jean ống suông rách gấu hoặc chân váy chữ A + Bốt da cao cổ (Combat boots).",
            "suitable_for": "Festival âm nhạc ngoài trời, du lịch khám phá Tây Bắc, phong cách Streetwear cá tính."
        },
        "wiki_files": {
            "cover": "Hmong women with traditional costume.jpg",
            "gallery": [
                "2 girls from Vietnam.jpg"
            ]
        }
    },
    {
        "id": "trang-phuc-cham",
        "name": "Trang Phục Truyền Thống Nữ Chăm",
        "era_origin": "Di sản Văn hóa Dân tộc Chăm (Vương quốc Champa xưa)",
        "era_code": "ETHNIC_HERITAGE",
        "category_type": "TRUYEN_THONG_CHAM",
        "collar_type": "Áo chui đầu cổ tròn khép kín (Aw babbun / Aw doe)",
        "sleeve_type": "Tay áo dài ôm sát cánh tay tôn vẻ thanh mảnh",
        "panel_count": 2,
        "region": "Duyên hải Nam Trung Bộ (Ninh Thuận, Bình Thuận, An Giang)",
        "ethnicity": "Chăm",
        "significance": "Mang vẻ đẹp huyền bí, tôn quý của những vũ nữ Apsara trên các tháp cổ ngàn năm. Trang phục thể hiện sự kín đáo tuyệt đối của người phụ nữ theo chế độ mẫu hệ, vừa mềm mại vừa uyển chuyển trong từng điệu múa quạt mừng năm mới.",
        "standard_materials": "Vải lụa mịn dệt thổ cẩm Mỹ Nghiệp, Sợi bông dệt hoa văn hình học cổ",
        "color_symbolism": "Màu trắng tinh khôi, màu đỏ rực rỡ, màu xanh lục bảo kết hợp đai thắt lưng ánh vàng",
        "occasion_usage": "Đại lễ hội Katê tại tháp Po Klong Garai, Lễ hội Ramuwan, đám cưới truyền thống Chăm",
        "design_rules": "Áo may liền thân chui đầu dáng suông dài phủ quá gối, không xẻ tà, quấn váy xăm (váy kín) ôm chân, thắt hai dải đai lưng chéo ngang hông và trước ngực có tua rua lộng lẫy.",
        "cultural_guardrails": {
            "critical_rules": [
                "Khăn trùm đầu Talei bằng vải trắng buông rủ ngang vai là dấu hiệu thiêng liêng thể hiện đức hạnh người con gái Chăm.",
                "Đai thắt lưng thổ cẩm có quy cách dệt hoa văn tháp Chăm và hạt lúa, không dùng đai lưng tạp chủng."
            ],
            "curator_note": "Điểm độc đáo nhất của áo nữ Chăm là áo chui đầu không xẻ tà như áo dài Kinh, ôm lấy thân người tôn lên dáng đi uyển chuyển khoan thai."
        },
        "remix_suggestions": {
            "concept_name": "Apsara Mystic Elegance",
            "ratio": {"traditional": 60, "contemporary": 30, "accessories": 10},
            "formula": "Áo dáng dài Chăm lụa trắng suông phủ gót + Thắt lưng dệt thổ cẩm Chăm hoa văn hình học vàng kim + Vòng tay kim loại khắc họa tiết Champa + Sandal dây đan tối giản.",
            "suitable_for": "Sự kiện giao lưu văn hóa quốc tế, biểu diễn nghệ thuật múa đương đại, thảm đỏ thời trang."
        },
        "wiki_files": {
            "cover": "Woman's costume, Cham, Ninh Thuan province - Vietnam National Museum of Fine Arts - Hanoi, Vietnam - DSC05160.JPG",
            "gallery": [
                "Cham women with traditional costume, Vietnam.jpg"
            ]
        }
    },
    {
        "id": "trang-phuc-dao-do",
        "name": "Trang Phục Nữ Dao Đỏ",
        "era_origin": "Di sản Dân tộc Miền Núi Phía Bắc",
        "era_code": "ETHNIC_HERITAGE",
        "category_type": "THO_CAM_DAN_TOC",
        "collar_type": "Cổ nẹp viền chỉ thêu hoa văn chữ vạn",
        "sleeve_type": "Tay áo thêu hoa văn chìm",
        "panel_count": 2,
        "region": "Tây Bắc & Đông Bắc (Lào Cai, Yên Bái, Hà Giang)",
        "ethnicity": "Dao (Dao Đỏ)",
        "significance": "Nổi bật với chiếc khăn đỏ rực rỡ trùm đầu và chuỗi quả bông đỏ trước ngực. Mỗi họa tiết thêu là một câu chuyện thần thoại về tổ tiên Bàn Hồ, cỏ cây hoa lá và ước vọng may mắn, sung túc.",
        "standard_materials": "Vải chàm dệt tay, Chỉ tơ nhuộm thảo dược đỏ thắm, Quả bông len thủ công, Trang sức bạc chạm hoa văn",
        "color_symbolism": "Màu đỏ son chủ đạo (biểu tượng hạnh phúc và sự sống mãnh liệt) kết hợp nền chàm đen sâu thẳm",
        "occasion_usage": "Lễ Cấp sắc (nghi lễ trưởng thành), Đám cưới truyền thống người Dao, Hội chợ tình Sa Pa",
        "design_rules": "Áo chàm xẻ ngực, bên trong mặc yếm thêu hoa văn bạc, vạt áo đính 7-9 quả bông đỏ to bản trước ngực, đầu đội khăn đỏ xếp nhiều lớp cầu kỳ.",
        "cultural_guardrails": {
            "critical_rules": [
                "Khăn đỏ trùm đầu là dấu chỉ quan trọng nhất xác định người phụ nữ Dao Đỏ đã có gia đình hay chưa.",
                "Hoa văn thêu hình hoa văn Bàn Vương và cây thông là biểu tượng cội nguồn linh thiêng."
            ],
            "curator_note": "Màu đỏ trong trang phục Dao Đỏ không chỉ làm đẹp mà còn mang ý nghĩa xua đuổi thú dữ và giữ ấm tâm can giữa mùa đông buốt giá miền núi cao."
        },
        "remix_suggestions": {
            "concept_name": "Red Pom-Pom Avant-Garde",
            "ratio": {"traditional": 60, "contemporary": 30, "accessories": 10},
            "formula": "Áo khoác Chàm đính chùm bông đỏ Dao Đỏ + Áo len cổ lọ đen tuyền + Quần ống loe đen hoặc chân váy midi xếp ly + Bốt da lộn cổ thấp.",
            "suitable_for": "Mùa đông Hà Nội, du lịch Sa Pa/Hà Giang, sự kiện triển lãm thời trang đương đại."
        },
        "wiki_files": {
            "cover": "Ethnical Minority of North Vietnam.jpg",
            "gallery": []
        }
    },
    {
        "id": "trang-phuc-thai-den",
        "name": "Trang Phục Áo Khóm Nữ Thái (Hàng Cúc Bướm Bạc)",
        "era_origin": "Di sản Văn hóa Dân tộc Thái Vùng Tây Bắc",
        "era_code": "ETHNIC_HERITAGE",
        "category_type": "THO_CAM_DAN_TOC",
        "collar_type": "Cổ chữ V hoặc khoét tròn ôm chân cổ đính cúc bướm",
        "sleeve_type": "Tay áo dài ôm sát cổ tay",
        "panel_count": 2,
        "region": "Tây Bắc (Sơn La, Điện Biên, Lai Châu)",
        "ethnicity": "Thái (Thái Đen & Thái Trắng)",
        "significance": "Đỉnh cao của sự thanh tao, thắt đáy lưng ong của người con gái Thái. Điểm nhấn là hàng cúc bướm bạc (Hàng Cúc Bướm / Cúc Con Ong) tinh xảo cài trước ngực, kết hợp cùng khăn Piêu thêu tay trứ danh và thắt lưng xanh lụa.",
        "standard_materials": "Vải bông dệt thủ công nhuộm chàm hoặc lụa mỏng, Khuy bạc chạm hình bướm, Vải nhung đen may váy",
        "color_symbolism": "Áo màu trắng, hồng nhạt hoặc chàm kết hợp váy nhung đen tuyền, đai xanh lục hoặc hồng sen",
        "occasion_usage": "Lễ hội Xên Bản Xên Mường, Lễ hội hoa ban, múa Xòe Thái (Di sản UNESCO), đám cưới bản mường",
        "design_rules": "Áo Khóm may ngắn tới cạp váy ôm khít eo, hàng cúc bạc đối xứng hình đôi bướm (tượng trưng cho tình yêu đôi lứa chung thủy), váy đen dài chấm gót ôm sát bước đi, đầu đội khăn Piêu thêu hoa văn chỉ màu.",
        "cultural_guardrails": {
            "critical_rules": [
                "Hàng cúc bướm bạc có số lượng chẵn (thường 12 - 14 con) đối xứng nhau mang ý nghĩa âm dương giao hòa.",
                "Khăn Piêu thêu tay là thước đo đức hạnh, tài khéo léo của người con gái Thái khi đến tuổi lấy chồng."
            ],
            "curator_note": "Hàng cúc bướm bạc vừa làm khuy cài áo vừa là bộ trang sức hộ mệnh cho người phụ nữ Thái tránh gió độc và trừ tà."
        },
        "remix_suggestions": {
            "concept_name": "Silver Butterfly Cropped Blouse",
            "ratio": {"traditional": 60, "contemporary": 30, "accessories": 10},
            "formula": "Áo Khóm lụa trắng cài cúc bướm bạc dáng crop-top + Quần tây ống suông cạp cao màu than chì + Khăn Piêu quàng cổ kiểu khăn lụa Twilly Pháp + Giày cao gót mũi nhọn.",
            "suitable_for": "Sự kiện thời trang dạ tiệc, tuần lễ thời trang Việt Nam, chụp ảnh Lookbook hiện đại."
        },
        "wiki_files": {
            "cover": "trang-phuc-thai-cover.jpg",
            "gallery": []
        }
    }
]

TAXONOMY = {
    "eras": [
        {
            "id": "LY_TRAN_LE",
            "name": "Thời Lý - Trần - Lê Sơ",
            "period": "Thế kỷ XI - Thế kỷ XVIII",
            "description": "Thời kỳ đỉnh cao của tinh thần tự chủ Đại Việt, hào khí Đông A, trang phục giao lĩnh và viên lĩnh thâm nghiêm, cốt cách ung dung."
        },
        {
            "id": "NGUYEN_DYNASTY",
            "name": "Thời Chúa Nguyễn & Triều Nguyễn",
            "period": "Năm 1744 - 1945",
            "description": "Thời kỳ định hình quốc phục chuẩn mực với áo ngũ thân lập lĩnh, áo tấc đại lễ và áo nhật bình hậu cung lộng lẫy."
        },
        {
            "id": "DAN_GIAN",
            "name": "Văn hóa Dân Gian Đồng Bằng",
            "period": "Cổ truyền đến thế kỷ XX",
            "description": "Hồn quê đất Việt với áo tứ thân mộc mạc, yếm đào duyên dáng và dải lụa thắt lưng bay trong tiếng hát hội làng."
        },
        {
            "id": "NAM_BO",
            "name": "Khẩn Hoang & Miệt Vườn Phương Nam",
            "period": "Thế kỷ XIX - Thế kỷ XX",
            "description": "Nét hào sảng, chất phác của miền sông nước Cửu Long với áo bà ba đen rợp bóng dừa và chiếc khăn rằn can trường."
        },
        {
            "id": "TAN_THOI",
            "name": "Thời Kỳ Tân Thời & Mỹ Thuật Đông Dương",
            "period": "Thập niên 1930 - 1954",
            "description": "Cuộc giao duyên rực rỡ giữa mỹ thuật Paris và tâm hồn Việt với Áo Dài Lemur và Lê Phổ tôn vinh vẻ đẹp tân tiến."
        },
        {
            "id": "ETHNIC_HERITAGE",
            "name": "Di Sản Thổ Cẩm Các Dân Tộc Bản Địa",
            "period": "Lưu truyền ngàn đời",
            "description": "Bản sắc văn hóa rực rỡ của cộng đồng các dân tộc anh em như H'Mông hoa, Dao đỏ, Chăm trên dải đất hình chữ S."
        }
    ],
    "categories": [
        {
            "id": "GIAO_LINH",
            "name": "Áo Giao Lĩnh (Trực Lĩnh)",
            "silhouette": "Cổ chéo vạt to, tay thụng rộng hoặc vừa, xẻ tà hai bên",
            "defining_feature": "Vạt áo chéo chữ V nẹp vải màu tương phản, vạt hữu đè vạt tả"
        },
        {
            "id": "VIEN_LINH",
            "name": "Áo Viên Lĩnh (Cổ Tròn)",
            "silhouette": "Cổ tròn ôm sát khép kín, thân suông rộng đĩnh đạc",
            "defining_feature": "Cổ tròn viền viền gối cài nút vai phải, trước ngực thường có bổ tử"
        },
        {
            "id": "NGU_THAN",
            "name": "Áo Ngũ Thân (Lập Lĩnh)",
            "silhouette": "Cổ đứng lập lĩnh cao, 5 thân áo ghép tà lượn chữ A, cài khuy bên hữu",
            "defining_feature": "5 nút cài tượng trưng Ngũ Thường, 5 thân áo tượng trưng Tứ thân phụ mẫu che chở con cái"
        },
        {
            "id": "NHAT_BINH",
            "name": "Áo Nhật Bình (Cổ Vuông)",
            "silhouette": "Cổ chữ nhật to bản trước ngực, vạt suông, tay thụng viền ngũ sắc",
            "defining_feature": "Viền cổ nẹp bản chữ nhật thêu đối xứng, dải ngũ sắc trước ngực và cổ tay"
        },
        {
            "id": "TU_THAN",
            "name": "Áo Tứ Thân & Yếm",
            "silhouette": "Bốn tà thon thả, hai tà sau may liền sống lưng, hai vạt trước buông lơi thắt nút",
            "defining_feature": "Đi kèm Áo Yếm đào bên trong và nón quai thao che nghiêng"
        },
        {
            "id": "BA_BA",
            "name": "Áo Bà Ba Nam Bộ",
            "silhouette": "Thân áo suông nhẹ, xẻ tà hai bên hông cao, hai túi nhỏ phía trước",
            "defining_feature": "Tiện dụng, chất phác, phối cùng khăn rằn và nón lá"
        },
        {
            "id": "AO_DAI_CACH_TAN",
            "name": "Áo Dài Tân Thời (Lemur / Lê Phổ)",
            "silhouette": "Chiết eo ôm sát, tay bồng nhún vai kiểu Tây phương, tà áo tha thướt",
            "defining_feature": "Cổ lá sen hoặc khoét thoáng, tạo nên diện mạo thời trang Á Đông hiện đại"
        },
        {
            "id": "THO_CAM_DAN_TOC",
            "name": "Trang Phục Thổ Cẩm Dân Tộc Bản Địa",
            "silhouette": "Váy xòe xếp ly nón cụt, áo chẽn xẻ ngực, đai lưng thổ cẩm bản lớn",
            "defining_feature": "Kỹ thuật dệt vải lanh, nhuộm chàm tự nhiên và vẽ hoa văn sáp ong (Batik)"
        },
        {
            "id": "TRUYEN_THONG_CHAM",
            "name": "Trang Phục Nữ Dân Tộc Chăm",
            "silhouette": "Áo chui đầu dáng dài qua gối không xẻ tà, váy kín, đai chéo ngang thân",
            "defining_feature": "Khăn trùm đầu Talei trắng buốt và đai thắt lưng thổ cẩm tinh xảo thêu hình tháp cổ"
        }
    ]
}


def download_with_retry(filename: str, dest_path: Path, max_retries: int = 3) -> bool:
    """Tải ảnh từ Wikimedia với retry và rate limiting thân thiện."""
    if dest_path.exists() and dest_path.stat().st_size > 2000:
        logger.info(f"Đã có sẵn: {dest_path.name}")
        return True

    dest_path.parent.mkdir(parents=True, exist_ok=True)

    # Nếu filename vốn là một file cục bộ trong thư mục ảnh hạt nhân
    local_candidate = dest_path.parent / filename
    if local_candidate.exists() and local_candidate.stat().st_size > 2000:
        if local_candidate != dest_path:
            dest_path.write_bytes(local_candidate.read_bytes())
        logger.info(f"Đã copy từ file cục bộ: {filename} -> {dest_path.name}")
        return True

    url = make_commons_redirect_url(filename, width=1000)

    for attempt in range(max_retries):
        try:
            # Nghỉ nhẹ giữa các lượt gọi để tuân thủ chính sách Wikimedia
            time.sleep(1.2)
            res = requests.get(url, headers=HEADERS, allow_redirects=True, timeout=25)

            if res.status_code == 200:
                # Kiểm tra tính hợp lệ bằng PIL
                img = Image.open(BytesIO(res.content))
                img.verify()

                with open(dest_path, "wb") as f:
                    f.write(res.content)
                logger.info(f"Đã tải thành công: {dest_path.name} ({len(res.content)} bytes)")
                return True
            elif res.status_code == 429:
                wait_time = (attempt + 1) * 3
                logger.warning(f"Bị 429 (Rate Limit). Chờ {wait_time}s rồi thử lại: {filename}")
                time.sleep(wait_time)
            else:
                logger.warning(f"Lỗi HTTP {res.status_code} khi tải {filename}")
        except Exception as e:
            logger.error(f"Lỗi khi tải {filename} (lần {attempt+1}): {e}")
            time.sleep(2)

    return False


def run_crawler_pipeline(project_root: Path):
    """Pipeline trích xuất, chuẩn hóa và lưu trữ catalog Việt phục."""
    logger.info("=== Khởi động Pipeline Thu Thập & Phân Loại Di Sản Phục Trang ===")

    assets_dir = project_root / "assets" / "costumes"
    static_seeds_dir = project_root / "backend" / "app" / "static" / "seeds"
    images_seeds_dir = static_seeds_dir / "images"

    assets_dir.mkdir(parents=True, exist_ok=True)
    images_seeds_dir.mkdir(parents=True, exist_ok=True)

    # Đảm bảo ảnh có sẵn ao-dai-1.png được đồng bộ vào seeds
    source_ao_dai = project_root / "assets" / "images" / "ao-dai-1.png"
    if source_ao_dai.exists():
        dest_ao_dai = images_seeds_dir / "ao-dai-sample.png"
        if not dest_ao_dai.exists():
            dest_ao_dai.write_bytes(source_ao_dai.read_bytes())
            logger.info("Đã đồng bộ asset ao-dai-sample.png vào thư mục hạt nhân.")

    catalog_output = {
        "metadata": {
            "title": "Kho Dữ Liệu Di Sản Việt Phục Remix (VietStyle AI)",
            "version": "1.0.0",
            "curator": "Digital Fashion Curator Atelier",
            "total_costumes": len(COSTUMES_DATA)
        },
        "taxonomy": TAXONOMY,
        "costumes": []
    }

    for item in COSTUMES_DATA:
        costume_id = item["id"]
        logger.info(f"Đang xử lý: {item['name']} [{costume_id}]")

        # 1. Tải ảnh bìa (Cover Image)
        cover_filename = item["wiki_files"]["cover"]
        ext = cover_filename.split(".")[-1].lower()
        if ext not in ["jpg", "jpeg", "png", "webp"]:
            ext = "jpg"
        local_cover_name = f"{costume_id}-cover.{ext}"
        cover_dest = images_seeds_dir / local_cover_name

        success = download_with_retry(cover_filename, cover_dest)
        local_cover_path = f"/static/seeds/images/{local_cover_name}" if success else make_commons_redirect_url(cover_filename)

        # 2. Tải bộ ảnh chi tiết (Gallery)
        local_gallery = []
        for idx, g_file in enumerate(item["wiki_files"].get("gallery", [])):
            g_ext = g_file.split(".")[-1].lower()
            if g_ext not in ["jpg", "jpeg", "png", "webp"]:
                g_ext = "jpg"
            local_g_name = f"{costume_id}-gallery-{idx+1}.{g_ext}"
            g_dest = images_seeds_dir / local_g_name
            g_success = download_with_retry(g_file, g_dest)
            local_gallery.append(f"/static/seeds/images/{local_g_name}" if g_success else make_commons_redirect_url(g_file))

        # 3. Chuẩn hóa bản ghi
        record = {
            "id": costume_id,
            "name": item["name"],
            "era_origin": item["era_origin"],
            "era_code": item["era_code"],
            "category_type": item["category_type"],
            "collar_type": item["collar_type"],
            "sleeve_type": item["sleeve_type"],
            "panel_count": item["panel_count"],
            "region": item["region"],
            "ethnicity": item["ethnicity"],
            "significance": item["significance"],
            "standard_materials": item["standard_materials"],
            "color_symbolism": item["color_symbolism"],
            "occasion_usage": item["occasion_usage"],
            "design_rules": item["design_rules"],
            "cultural_guardrails": item["cultural_guardrails"],
            "remix_suggestions": item["remix_suggestions"],
            "cover_image": local_cover_path,
            "gallery": local_gallery
        }
        catalog_output["costumes"].append(record)

    # 4. Ghi file catalog json
    seeds_json_path = static_seeds_dir / "costumes_catalog.json"
    with open(seeds_json_path, "w", encoding="utf-8") as f:
        json.dump(catalog_output, f, ensure_ascii=False, indent=2)
    logger.info(f"Đã lưu catalog hoàn chỉnh vào: {seeds_json_path}")

    assets_json_path = project_root / "assets" / "costumes_catalog.json"
    with open(assets_json_path, "w", encoding="utf-8") as f:
        json.dump(catalog_output, f, ensure_ascii=False, indent=2)
    logger.info(f"Đã lưu bản sao vào: {assets_json_path}")

    logger.info(f"Hoàn thành! Đã thu thập và chuẩn hóa dữ liệu cho {len(catalog_output['costumes'])} trang phục.")
    return catalog_output


if __name__ == "__main__":
    current_dir = Path(__file__).resolve().parent
    root = current_dir.parent.parent.parent
    run_crawler_pipeline(root)
