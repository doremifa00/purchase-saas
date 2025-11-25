-- =============================================
-- 중고폰 매입 관리 시스템 - Supabase Schema
-- =============================================

-- 1. 회사 정보 테이블
CREATE TABLE companies (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    type VARCHAR(100),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. 사용자 테이블
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    role VARCHAR(100),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. 거래처(매입처) 테이블
CREATE TABLE vendors (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
    code VARCHAR(50) NOT NULL,
    name VARCHAR(255) NOT NULL,
    contact_info TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(company_id, code)
);

-- 4. 상품 마스터 테이블
CREATE TABLE products (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    model_code VARCHAR(100) NOT NULL UNIQUE,
    model_name VARCHAR(255) NOT NULL,
    pet_name VARCHAR(255),
    manufacturer VARCHAR(100),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 5. 공통 코드 테이블 (상품등급, 색상, 통신사 등)
CREATE TABLE common_codes (
    code VARCHAR(50) PRIMARY KEY,
    category VARCHAR(50) NOT NULL,
    name VARCHAR(255) NOT NULL,
    name_en VARCHAR(255),
    sort_order INT DEFAULT 0,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 6. 차감 항목 마스터 테이블 (액파, LCD, 터치불량 등)
CREATE TABLE deduction_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    name_en VARCHAR(255),
    default_cost DECIMAL(12, 2) DEFAULT 0,
    sort_order INT DEFAULT 0,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 7. 매입 전표 테이블
CREATE TABLE purchases (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
    vendor_id UUID REFERENCES vendors(id) ON DELETE SET NULL,
    purchase_date DATE NOT NULL,
    status VARCHAR(50) NOT NULL DEFAULT '검수대기', -- 검수대기, 일부정산, 정산대기, 정산완료
    remarks TEXT,
    remittance_info TEXT,
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 8. 매입 상품 상세 테이블
CREATE TABLE purchase_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    purchase_id UUID REFERENCES purchases(id) ON DELETE CASCADE,
    product_id UUID REFERENCES products(id) ON DELETE SET NULL,
    barcode VARCHAR(100),
    imei VARCHAR(100),
    imei2 VARCHAR(100),
    serial_number VARCHAR(100),
    grade_code VARCHAR(50) REFERENCES common_codes(code),
    color_code VARCHAR(50) REFERENCES common_codes(code),
    carrier_code VARCHAR(50) REFERENCES common_codes(code),
    purchase_price DECIMAL(12, 2) NOT NULL DEFAULT 0,
    deduction_total DECIMAL(12, 2) DEFAULT 0,
    additional_total DECIMAL(12, 2) DEFAULT 0,
    final_price DECIMAL(12, 2) GENERATED ALWAYS AS (purchase_price - deduction_total + additional_total) STORED,
    remarks TEXT,
    is_lost BOOLEAN DEFAULT FALSE,
    is_repaired BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 9. 상품별 차감 내역 테이블 (Many-to-Many: DEDUCTION_HISTORY)
CREATE TABLE item_deductions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    purchase_item_id UUID REFERENCES purchase_items(id) ON DELETE CASCADE,
    deduction_item_id UUID REFERENCES deduction_items(id) ON DELETE CASCADE,
    amount DECIMAL(12, 2) NOT NULL DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =============================================
-- 인덱스 생성 (성능 최적화)
-- =============================================
CREATE INDEX idx_purchases_company ON purchases(company_id);
CREATE INDEX idx_purchases_vendor ON purchases(vendor_id);
CREATE INDEX idx_purchases_date ON purchases(purchase_date);
CREATE INDEX idx_purchase_items_purchase ON purchase_items(purchase_id);
CREATE INDEX idx_purchase_items_barcode ON purchase_items(barcode);
CREATE INDEX idx_purchase_items_imei ON purchase_items(imei);
CREATE INDEX idx_item_deductions_purchase_item ON item_deductions(purchase_item_id);

-- =============================================
-- 샘플 데이터 삽입
-- =============================================

-- 1. 회사 데이터
INSERT INTO companies (id, name, type) VALUES 
    ('11111111-1111-1111-1111-111111111111', '누리정보 통신', 'MAIN');

-- 2. 사용자 데이터
INSERT INTO users (id, company_id, name, email, role) VALUES 
    ('22222222-2222-2222-2222-222222222222', '11111111-1111-1111-1111-111111111111', '헤일리 김', 'hailey@example.com', 'ADMIN');

-- 3. 공통 코드 (상품등급)
INSERT INTO common_codes (code, category, name, name_en, sort_order) VALUES
    ('GRADE_S', 'GRADE', 'S급', 'S Grade', 1),
    ('GRADE_A', 'GRADE', 'A급', 'A Grade', 2),
    ('GRADE_B', 'GRADE', 'B급', 'B Grade', 3),
    ('GRADE_C', 'GRADE', 'C급', 'C Grade', 4);

-- 4. 공통 코드 (통신사)
INSERT INTO common_codes (code, category, name, name_en, sort_order) VALUES
    ('CARRIER_SKT', 'CARRIER', 'SKT', 'SK Telecom', 1),
    ('CARRIER_KT', 'CARRIER', 'KT', 'KT', 2),
    ('CARRIER_LG', 'CARRIER', 'LG U+', 'LG U+', 3);

-- 5. 공통 코드 (색상)
INSERT INTO common_codes (code, category, name, name_en, sort_order) VALUES
    ('COLOR_BLACK', 'COLOR', '블랙', 'Black', 1),
    ('COLOR_WHITE', 'COLOR', '화이트', 'White', 2),
    ('COLOR_GOLD', 'COLOR', '골드', 'Gold', 3),
    ('COLOR_RED', 'COLOR', '레드', 'Red', 4);

-- 6. 차감 항목 데이터
INSERT INTO deduction_items (name, name_en, default_cost, sort_order) VALUES
    ('액파', 'Screen Crack', 50000, 1),
    ('액파(백화)', 'Screen Crack (Whitening)', 70000, 2),
    ('중잔', 'Medium Scratch', 30000, 3),
    ('LCD', 'LCD Defect', 80000, 4),
    ('터치 불량', 'Touch Defect', 60000, 5),
    ('강잔', 'Heavy Scratch', 40000, 6),
    ('카메라불량', 'Camera Defect', 55000, 7),
    ('지문/페이스', 'Fingerprint/Face ID', 45000, 8),
    ('나침반', 'Compass', 25000, 9),
    ('WIFI 불량', 'WIFI Defect', 35000, 10);

-- 7. 거래처 샘플
INSERT INTO vendors (company_id, code, name) VALUES
    ('11111111-1111-1111-1111-111111111111', 'V001', '창원팀'),
    ('11111111-1111-1111-1111-111111111111', 'V002', '부산지사'),
    ('11111111-1111-1111-1111-111111111111', 'V003', '서울본사');

-- 8. 상품 샘플
INSERT INTO products (model_code, model_name, pet_name, manufacturer) VALUES
    ('AIP12-128G', 'iPhone 12 Pro Max 128GB', '아이폰12 프로맥스 128G', 'APPLE'),
    ('AIP13-256G', 'iPhone 13 Pro 256GB', '아이폰13 프로 256G', 'APPLE'),
    ('SMG-S21', 'Galaxy S21 Ultra', '갤럭시 S21 울트라', 'SAMSUNG');

-- =============================================
-- RLS (Row Level Security) 정책 (선택사항)
-- =============================================
-- Supabase에서 보안을 위해 RLS를 활성화할 수 있습니다
-- ALTER TABLE purchases ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE purchase_items ENABLE ROW LEVEL SECURITY;

-- 예: 자신의 회사 데이터만 조회 가능
-- CREATE POLICY "Users can view own company purchases" 
--   ON purchases FOR SELECT 
--   USING (company_id = (SELECT company_id FROM users WHERE id = auth.uid()));
