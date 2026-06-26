import CandidateTriage from '~/components/CandidateTriage';

export default function CaseView(props: { params: Promise<{ caseId: string }> }) {
  return (
    <main>
      <section>
        <p>
          이 결과는 <strong>공개적으로 인덱싱된</strong> 노출만 반영합니다 (results reflect only
          publicly-indexed exposure). 텔레그램, 비공개 포럼 등 폐쇄 플랫폼의 노출은 자동으로
          탐지되지 않으며 별도의 수동 신고가 필요합니다.
        </p>
        <ul>
          <li>
            <a href="https://stopncii.org/" target="_blank" rel="noreferrer">
              StopNCII.org
            </a>
          </li>
          <li>
            <a href="https://takeitdown.ncmec.org/" target="_blank" rel="noreferrer">
              NCMEC Take It Down
            </a>
          </li>
          <li>
            <a
              href="https://support.google.com/websearch/answer/9116649"
              target="_blank"
              rel="noreferrer"
            >
              Google explicit-image removal
            </a>
          </li>
        </ul>
      </section>
      <CandidateTriage params={props.params} />
    </main>
  );
}
