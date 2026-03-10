import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Editor from '@monaco-editor/react';
import { getProblemDetail, updateProblem } from '../Api/ProblemAPI';
import { getClassById } from '../Api/ClassAPI';
import './ProblemEdit.css';

const PlusIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
    </svg>
);
const MinusIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 12h-15" />
    </svg>
);

const ProblemEdit = () => {
    const { classId, problemId } = useParams();
    const navigate = useNavigate();
    const [problemTitle, setProblemTitle] = useState('');
    const [problemDescription, setProblemDescription] = useState('');
    const [score, setScore] = useState(0);
    const [functionName, setFunctionName] = useState('');
    const [defaultCode, setDefaultCode] = useState('');
    const [exampleCases, setExampleCases] = useState([]);
    const [testCases, setTestCases] = useState([]);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState(null);
    const [classLanguage, setClassLanguage] = useState('');

    useEffect(() => {
        const fetchProblemAndClass = async () => {
            try {
                const [problemData, classData] = await Promise.all([ getProblemDetail(problemId), getClassById(classId) ]);
                setProblemTitle(problemData.title);
                setProblemDescription(problemData.description);
                setScore(problemData.score);
                setFunctionName(problemData.function_name || '');
                setDefaultCode(problemData.default_code || '');
                setClassLanguage(classData.language);
                const toStateFormat = (cases) => (cases || []).map((c, index) => ({ id: c.id || Date.now() + index, inputs: (c.input || '').split('\n'), expected_output: c.expected_output || '' }));
                setExampleCases(toStateFormat(problemData.examples));
                setTestCases(toStateFormat(problemData.testcases));
            } catch (err) {
                setError("문제 정보를 불러오는 데 실패했습니다.");
            } finally {
                setLoading(false);
            }
        };
        fetchProblemAndClass();
    }, [problemId, classId]);

    const getCasesState = (type) => type === 'example' ? { cases: exampleCases, setCases: setExampleCases } : { cases: testCases, setCases: setTestCases };
    const handleAddCase = (type) => { const { setCases } = getCasesState(type); setCases(prev => [...prev, { id: Date.now(), inputs: [''], expected_output: '' }]); };
    const handleRemoveCase = (type, idToRemove) => { const { cases, setCases } = getCasesState(type); setCases(cases.filter(c => c.id !== idToRemove)); };
    const handleChangeCaseOutput = (type, idToUpdate, value) => { const { cases, setCases } = getCasesState(type); setCases(cases.map(c => c.id === idToUpdate ? { ...c, expected_output: value } : c)); };
    const handleChangeCaseInput = (type, idToUpdate, inputIndex, value) => { const { cases, setCases } = getCasesState(type); setCases(cases.map(c => c.id === idToUpdate ? { ...c, inputs: c.inputs.map((input, idx) => idx === inputIndex ? value : input) } : c)); };
    const handleAddCaseInput = (type, idToUpdate) => { const { cases, setCases } = getCasesState(type); setCases(cases.map(c => c.id === idToUpdate ? { ...c, inputs: [...c.inputs, ''] } : c)); };
    const handleRemoveCaseInput = (type, idToUpdate, inputIndex) => { const { cases, setCases } = getCasesState(type); setCases(cases.map(c => { if (c.id === idToUpdate) { const newInputs = c.inputs.filter((_, idx) => idx !== inputIndex); return { ...c, inputs: newInputs.length > 0 ? newInputs : [''] }; } return c; })); };

    const handleSubmit = async (e) => {
        e.preventDefault(); setSubmitting(true); setError(null);
        if (!problemTitle || !problemDescription || (classLanguage === 'python' && !functionName)) { setError('필수 항목을 모두 입력해주세요.'); setSubmitting(false); return; }
        const formatCasesForApi = (cases) => cases.filter(c => c.inputs.some(input => input.trim() !== '') || c.expected_output.trim() !== '').map(c => ({ input: c.inputs.join('\n'), expected_output: c.expected_output }));
        const updatedProblem = { course_id: parseInt(classId, 10), title: problemTitle, description: problemDescription, score: parseInt(score, 10), function_name: classLanguage === 'python' ? functionName : null, default_code: defaultCode, examples: formatCasesForApi(exampleCases), testcases: formatCasesForApi(testCases) };
        try { await updateProblem(problemId, updatedProblem); alert('문제가 성공적으로 수정되었습니다!'); navigate(`/admin/classes/${classId}/problems/detail/${problemId}`); } catch (err) { setError('문제 수정 실패: ' + (err.response?.data?.detail || err.message)); } finally { setSubmitting(false); }
    };

    if (loading) return <div className="loading-message">로딩 중...</div>;
    if (error) return <div className="error-message">{error}</div>;

    return (
        <div className="problemedit-problem-add-container">
            <h2>문제 수정</h2>
            <form onSubmit={handleSubmit} className="problemedit-problem-add-form">
                <div className="problemedit-form-group">
                    <label htmlFor="problemTitle">문제 제목:</label>
                    <input
                        type="text"
                        id="problemTitle"
                        value={problemTitle}
                        onChange={(e) => setProblemTitle(e.target.value)}
                        required
                        disabled={submitting}
                    />
                </div>

                <div className="problemedit-form-group">
                    <label htmlFor="problemDescription">문제 설명:</label>
                    <textarea
                        id="problemDescription"
                        value={problemDescription}
                        onChange={(e) => setProblemDescription(e.target.value)}
                        rows="5"
                        required
                        disabled={submitting}
                    ></textarea>
                </div>

                <div className="problemedit-form-group">
                    <label htmlFor="score">배점:</label>
                    <input
                        type="number"
                        id="score"
                        value={score}
                        onChange={(e) => setScore(e.target.value)}
                        required
                        min="0"
                        disabled={submitting}
                    />
                </div>

                {classLanguage === 'python' && (
                    <div className="problemedit-form-group">
                        <label htmlFor="functionName">함수 이름:</label>
                        <input
                            type="text"
                            id="functionName"
                            value={functionName}
                            onChange={(e) => setFunctionName(e.target.value)}
                            required={classLanguage === 'python'}
                            disabled={submitting}
                        />
                    </div>
                )}

                <div className="problemedit-form-group">
                    <label htmlFor="defaultCode">기본 코드:</label>
                    <div className="problemedit-editor-wrapper">
                        <Editor
                            height="25vh"
                            language={classLanguage || 'python'}
                            value={defaultCode}
                            onChange={(value) => setDefaultCode(value || "")}
                            theme="vs-dark"
                            options={{
                                minimap: { enabled: false },
                                scrollBeyondLastLine: false,
                                fontSize: 14,
                                tabSize: 4,
                            }}
                        />
                    </div>
                </div>

                <div className="problemedit-dynamic-section">
                    <div className="problemedit-section-header">
                        <h3>예시</h3>
                        <button type="button" onClick={() => handleAddCase('example')} className="problemedit-add-test-case-btn" disabled={submitting}>
                            + 예시 추가
                        </button>
                    </div>
                    {exampleCases.length > 0 ? (
                        <table className="problemedit-test-case-table">
                            <thead>
                                <tr>
                                    <th className="problemedit-test-case-col-index">No.</th>
                                    <th className="problemedit-test-case-col-input">입력</th>
                                    <th className="problemedit-test-case-col-output">예상 출력</th>
                                    <th className="problemedit-test-case-col-action">관리</th>
                                </tr>
                            </thead>
                            <tbody>
                                {exampleCases.map((ec, index) => (
                                    <tr key={ec.id}>
                                        {/* ▼▼▼ [수정] data-label 속성 추가 ▼▼▼ */}
                                        <td data-label="No." className="problemedit-test-case-col-index">{index + 1}</td>
                                        <td data-label="입력" className="problemedit-test-case-col-input">
                                            <div className="problemedit-test-case-input-container">
                                                {ec.inputs.map((input, inputIndex) => (
                                                    <div key={inputIndex} className="problemedit-test-case-input-group">
                                                        <input
                                                            type="text"
                                                            value={input}
                                                            onChange={(e) => handleChangeCaseInput('example', ec.id, inputIndex, e.target.value)}
                                                            disabled={submitting}
                                                        />
                                                        <div className="problemedit-input-actions">
                                                            {ec.inputs.length > 1 && (
                                                                <button type="button" onClick={() => handleRemoveCaseInput('example', ec.id, inputIndex)} className="problemedit-icon-btn remove" disabled={submitting}>
                                                                    <MinusIcon />
                                                                </button>
                                                            )}
                                                            {inputIndex === ec.inputs.length - 1 && ec.inputs.length < 10 && (
                                                                <button type="button" onClick={() => handleAddCaseInput('example', ec.id)} className="problemedit-icon-btn add" disabled={submitting}>
                                                                    <PlusIcon />
                                                                </button>
                                                            )}
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </td>
                                        <td data-label="예상 출력" className="problemedit-test-case-col-output">
                                            <textarea
                                                value={ec.expected_output}
                                                onChange={(e) => handleChangeCaseOutput('example', ec.id, e.target.value)}
                                                rows="1"
                                                disabled={submitting}
                                            ></textarea>
                                        </td>
                                        <td data-label="관리" className="problemedit-test-case-col-action">
                                            <button
                                                type="button"
                                                onClick={() => handleRemoveCase('example', ec.id)}
                                                className="problemedit-remove-test-case-button"
                                                disabled={submitting || exampleCases.length <= 1}
                                            >
                                                삭제
                                            </button>
                                        </td>
                                        {/* ▲▲▲ [수정] 여기까지 ▲▲▲ */}
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    ) : (
                        <p className="no-items-message">예시가 없습니다.</p>
                    )}
                </div>

                <div className="problemedit-dynamic-section">
                    <div className="problemedit-section-header">
                        <h3>테스트케이스</h3>
                        <button type="button" onClick={() => handleAddCase('test')} className="problemedit-add-test-case-btn" disabled={submitting}>
                            + 테스트케이스 추가
                        </button>
                    </div>
                    {testCases.length > 0 ? (
                        <table className="problemedit-test-case-table">
                            <thead>
                                <tr>
                                    <th className="problemedit-test-case-col-index">No.</th>
                                    <th className="problemedit-test-case-col-input">입력</th>
                                    <th className="problemedit-test-case-col-output">예상 출력</th>
                                    <th className="problemedit-test-case-col-action">관리</th>
                                </tr>
                            </thead>
                            <tbody>
                                {testCases.map((tc, index) => (
                                    <tr key={tc.id}>
                                        {/* ▼▼▼ [수정] data-label 속성 추가 ▼▼▼ */}
                                        <td data-label="No." className="problemedit-test-case-col-index">{index + 1}</td>
                                        <td data-label="입력" className="problemedit-test-case-col-input">
                                            <div className="problemedit-test-case-input-container">
                                                {tc.inputs.map((input, inputIndex) => (
                                                    <div key={inputIndex} className="problemedit-test-case-input-group">
                                                        <input
                                                            type="text"
                                                            value={input}
                                                            onChange={(e) => handleChangeCaseInput('test', tc.id, inputIndex, e.target.value)}
                                                            disabled={submitting}
                                                        />
                                                        <div className="problemedit-input-actions">
                                                            {tc.inputs.length > 1 && (
                                                                <button type="button" onClick={() => handleRemoveCaseInput('test', tc.id, inputIndex)} className="problemedit-icon-btn remove" disabled={submitting}>
                                                                    <MinusIcon />
                                                                </button>
                                                            )}
                                                            {inputIndex === tc.inputs.length - 1 && tc.inputs.length < 10 && (
                                                                <button type="button" onClick={() => handleAddCaseInput('test', tc.id)} className="problemedit-icon-btn add" disabled={submitting}>
                                                                    <PlusIcon />
                                                                </button>
                                                            )}
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </td>
                                        <td data-label="예상 출력" className="problemedit-test-case-col-output">
                                            <textarea
                                                value={tc.expected_output}
                                                onChange={(e) => handleChangeCaseOutput('test', tc.id, e.target.value)}
                                                rows="1"
                                                disabled={submitting}
                                            ></textarea>
                                        </td>
                                        <td data-label="관리" className="problemedit-test-case-col-action">
                                            <button
                                                type="button"
                                                onClick={() => handleRemoveCase('test', tc.id)}
                                                className="problemedit-remove-test-case-button"
                                                disabled={submitting || testCases.length <= 1}
                                            >
                                                삭제
                                            </button>
                                        </td>
                                        {/* ▲▲▲ [수정] 여기까지 ▲▲▲ */}
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    ) : (
                        <p className="no-items-message">테스트케이스가 없습니다.</p>
                    )}
                </div>

                {error && <p className="error-message">{error}</p>}
                
                <div className="problemedit-form-buttons">
                    <button type="submit" className="problemedit-submit-button" disabled={submitting}>
                        {submitting ? '수정 중...' : '문제 수정'}
                    </button>
                    <button type="button" className="problemedit-cancel-button" onClick={() => navigate(-1)} disabled={submitting}>
                        취소
                    </button>
                </div>
            </form>
        </div>
    );
};
export default ProblemEdit;