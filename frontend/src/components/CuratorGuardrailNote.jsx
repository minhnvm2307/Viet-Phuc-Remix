import React from 'react';

// Ghi chú Giám tuyển hiển thị khi mô tả phối đồ chạm quy tắc kiêng kỵ (CAUTION)
// hoặc bị chặn vì xuyên tạc văn hóa (BLOCK). Không icon, không mô tả dài dòng —
// đúng tinh thần "Ghi chú của Nhà nghiên cứu" trong DESIGN.md.
export default function CuratorGuardrailNote({ guardrail }) {
  if (!guardrail || guardrail.verdict === 'OK' || !guardrail.curator_feedback) {
    return null;
  }

  const isBlocked = guardrail.verdict === 'BLOCK';

  return (
    <div className={`curator-guardrail-note ${isBlocked ? 'blocked' : 'caution'}`}>
      <span className="curator-guardrail-label">
        {isBlocked ? 'Ghi chú giám tuyển — cần điều chỉnh' : 'Ghi chú giám tuyển'}
      </span>
      <p className="curator-guardrail-text">{guardrail.curator_feedback}</p>
    </div>
  );
}
