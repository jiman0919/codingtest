import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import Editor from '@monaco-editor/react';
import { addProblem } from '../Api/ProblemAPI';
import { getClassById } from '../Api/ClassAPI';
import './ProblemAdd.css';

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


const ProblemAdd = () => {
    const navigate = useNavigate();
    const { classId } = useParams();

    const [problemTitle, setProblemTitle] = useState('');
    const [problemDescription, setProblemDescription] = useState('');
    const [score, setScore] = useState(0);

    const [exampleCases, setExampleCases] = useState([{ id: Date.now(), inputs: [''], expected_output: '' }]);
    const [testCases, setTestCases] = useState([{ id: Date.now(), inputs: [''], expected_output: '' }]);

    const [functionName, setFunctionName] = useState('');
    const [defaultCode, setDefaultCode] = useState('');
    
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [classLanguage, setClassLanguage] = useState('');

    useEffect(() => {
        const fetchClassLanguage = async () => {
            try {
                const classData = await getClassById(classId);
                setClassLanguage(classData.language);
            } catch (err) {
                console.error('강좌 언어 정보를 가져오는데 실패했습니다:', err);
                setError('강좌 언어 정보를 불러오는데 실패했습니다.');
            }
        };
    
        if (classId) {
            fetchClassLanguage();
        } else {
            setClassLanguage('python');
        }
    }, [classId]);
    
    // 공통 핸들러 함수
    const getCasesState = (type) => type === 'example' ? { cases: exampleCases, setCases: setExampleCases } : { cases: testCases, setCases: setTestCases };

    const handleAddCase = (type) => {
        const { setCases } = getCasesState(type);
        setCases(prev => [...prev, { id: Date.now(), inputs: [''], expected_output: '' }]);
    };

    const handleRemoveCase = (type, idToRemove) => {
        const { cases, setCases } = getCasesState(type);
        setCases(cases.filter(c => c.id !== idToRemove));
    };
    
    const handleChangeCaseOutput = (type, idToUpdate, value) => {
        const { cases, setCases } = getCasesState(type);
        setCases(cases.map(c => c.id === idToUpdate ? { ...c, expected_output: value } : c));
    };

    const handleChangeCaseInput = (type, idToUpdate, inputIndex, value) => {
        const { cases, setCases } = getCasesState(type);
        setCases(cases.map(c => 
            c.id === idToUpdate 
            ? { ...c, inputs: c.inputs.map((input, idx) => idx === inputIndex ? value : input) } 
            : c
        ));
    };

    const handleAddCaseInput = (type, idToUpdate) => {
        const { cases, setCases } = getCasesState(type);
        setCases(cases.map(c => 
            c.id === idToUpdate ? { ...c, inputs: [...c.inputs, ''] } : c
        ));
    };

    const handleRemoveCaseInput = (type, idToUpdate, inputIndex) => {
        const { cases, setCases } = getCasesState(type);
        setCases(cases.map(c => {
            if (c.id === idToUpdate) {
                const newInputs = c.inputs.filter((_, idx) => idx !== inputIndex);
                return { ...c, inputs: newInputs.length > 0 ? newInputs : [''] };
            }
            return c;
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        if (!problemTitle || !problemDescription) {
            setError('문제 제목과 설명을 입력해주세요.');
            setLoading(false);
            return;
        }

        if (classLanguage === 'python' && !functionName) {
            setError('Python 강좌는 함수 이름을 필수로 입력해야 합니다.');
            setLoading(false);
            return;
        }

        const courseIdInt = parseInt(classId, 10);
        if (isNaN(courseIdInt)) {
            setError('유효하지 않은 강좌 ID입니다. URL을 확인해주세요.');
            setLoading(false);
            return;
        }
        
        const formatCasesForApi = (cases) => {
            return cases
                .filter(c => c.inputs.some(input => input.trim() !== '') || c.expected_output.trim() !== '')
                .map(c => ({
                    input: c.inputs.filter(input => input.trim() !== '').join('\n'),
                    expected_output: c.expected_output
                }));
        };

        const newProblem = {
            course_id: courseIdInt,
            title: problemTitle,
            description: problemDescription,
            score: parseInt(score, 10) || 0,
            examples: formatCasesForApi(exampleCases),
            function_name: classLanguage === 'python' ? functionName : null,
            default_code: defaultCode,
            testcases: formatCasesForApi(testCases)
        };
        
        console.log("백엔드로 보낼 최종 문제 데이터:", newProblem);

        try {
            await addProblem(newProblem);
            alert('문제가 성공적으로 추가되었습니다!');
            
            navigate(classId ? `/admin/classes/${classId}/problems` : '/admin/problems');
        } catch (err) {
            console.error('문제 추가 실패:', err);
            let errorMessage = '문제 추가에 실패했습니다.';
            if (err.response?.data) {
                const errorData = err.response.data;
                const detail = Array.isArray(errorData) 
                    ? errorData.map(e => e.detail || JSON.stringify(e)).join(', ')
                    : errorData.detail || JSON.stringify(errorData);
                errorMessage += ` 상세 오류: ${detail}`;
            } else if (err.message) {
                errorMessage += ` 상세 오류: ${err.message}`;
            }
            alert(errorMessage);
            setError(errorMessage);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="problemadd-problem-add-container">
            <h2>새 문제 추가 {classId ? `(강좌 ID: ${classId})` : ''}</h2>
            <form onSubmit={handleSubmit} className="problemadd-problem-add-form">
                <div className="problemadd-form-group">
                    <label htmlFor="problemTitle">문제 제목:</label>
                    <input id="problemTitle" type="text" value={problemTitle} onChange={(e) => setProblemTitle(e.target.value)} required disabled={loading} placeholder="문제 이름을 입력하세요" />
                </div>
                <div className="problemadd-form-group">
                    <label htmlFor="problemDescription">문제 설명:</label>
                    <textarea id="problemDescription" value={problemDescription} onChange={(e) => setProblemDescription(e.target.value)} rows="5" required disabled={loading} placeholder="문제 설명을 입력하세요"></textarea>
                </div>
                <div className="problemadd-form-group">
                    <label htmlFor="score">배점:</label>
                    <input id="score" type="number" value={score} onChange={(e) => setScore(e.target.value)} required min="0" disabled={loading} placeholder="점수를 입력하세요 (예: 100)" />
                </div>
                
                {classLanguage === 'python' && (
                    <div className="problemadd-form-group">
                        <label htmlFor="functionName">함수 이름:</label>
                        <input id="functionName" type="text" value={functionName} onChange={(e) => setFunctionName(e.target.value)} required={classLanguage === 'python'} disabled={loading} placeholder="예: solution" />
                    </div>
                )}
                <div className="problemadd-form-group">
                    <label htmlFor="defaultCode">기본 코드:</label>
                    <div className="problem-editor-wrapper">
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
                
                {/* 예시 케이스 섹션 */}
                <div className="problemadd-dynamic-section">
                    <div className="problemadd-section-header">
                        <h3>예시</h3>
                        <button type="button" onClick={() => handleAddCase('example')} className="problemadd-add-button problemadd-add-test-case-btn" disabled={loading}>+ 예시 추가</button>
                    </div>
                    {exampleCases.length > 0 ? (
                        <table className="problemadd-dynamic-table problemadd-test-case-table">
                            <thead>
                                <tr>
                                    <th className="problemadd-test-case-col-index">No.</th>
                                    <th className="problemadd-test-case-col-input">입력</th>
                                    <th className="problemadd-test-case-col-output">예상 출력</th>
                                    <th className="problemadd-test-case-col-action">관리</th>
                                </tr>
                            </thead>
                            <tbody>
                                {exampleCases.map((exampleCase, index) => (
                                    <tr key={exampleCase.id}>
                                        <td className="problemadd-test-case-col-index">{index + 1}</td>
                                        <td className="problemadd-test-case-col-input">
                                            <div className="problemadd-test-case-input-container">
                                                {exampleCase.inputs.map((input, inputIndex) => (
                                                    <div key={inputIndex} className="problemadd-test-case-input-group">
                                                        <input type="text" value={input} onChange={(e) => handleChangeCaseInput('example', exampleCase.id, inputIndex, e.target.value)} placeholder={`입력 ${inputIndex + 1}`} disabled={loading} />
                                                        <div className="problemadd-input-actions">
                                                            {exampleCase.inputs.length > 1 && (
                                                                <button type="button" onClick={() => handleRemoveCaseInput('example', exampleCase.id, inputIndex)} className="problemadd-icon-btn remove" disabled={loading}><MinusIcon /></button>
                                                            )}
                                                            {inputIndex === exampleCase.inputs.length - 1 && exampleCase.inputs.length < 10 && (
                                                                <button type="button" onClick={() => handleAddCaseInput('example', exampleCase.id)} className="problemadd-icon-btn add" disabled={loading}><PlusIcon /></button>
                                                            )}
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </td>
                                        <td className="problemadd-test-case-col-output"><textarea value={exampleCase.expected_output} onChange={(e) => handleChangeCaseOutput('example', exampleCase.id, e.target.value)} rows="1" disabled={loading}></textarea></td>
                                        <td className="problemadd-test-case-col-action"><button type="button" onClick={() => handleRemoveCase('example', exampleCase.id)} className="problemadd-remove-test-case-button" disabled={loading || exampleCases.length === 1}>삭제</button></td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    ) : (
                        <p className="problemadd-no-items-message">예시가 없습니다. '예시 추가' 버튼을 눌러 추가하세요.</p>
                    )}
                </div>
                
                {/* 테스트 케이스 섹션 */}
                <div className="problemadd-dynamic-section">
                    <div className="problemadd-section-header">
                        <h3>테스트케이스</h3>
                        <button type="button" onClick={() => handleAddCase('test')} className="problemadd-add-button problemadd-add-test-case-btn" disabled={loading}>+ 테스트케이스 추가</button>
                    </div>
                    {testCases.length > 0 ? (
                         <table className="problemadd-dynamic-table problemadd-test-case-table">
                            <thead>
                                <tr>
                                    <th className="problemadd-test-case-col-index">No.</th>
                                    <th className="problemadd-test-case-col-input">입력</th>
                                    <th className="problemadd-test-case-col-output">예상 출력</th>
                                    <th className="problemadd-test-case-col-action">관리</th>
                                </tr>
                            </thead>
                            <tbody>
                                {testCases.map((testCase, index) => (
                                    <tr key={testCase.id}>
                                        <td className="problemadd-test-case-col-index">{index + 1}</td>
                                        <td className="problemadd-test-case-col-input">
                                            <div className="problemadd-test-case-input-container">
                                                {testCase.inputs.map((input, inputIndex) => (
                                                    <div key={inputIndex} className="problemadd-test-case-input-group">
                                                        <input type="text" value={input} onChange={(e) => handleChangeCaseInput('test', testCase.id, inputIndex, e.target.value)} placeholder={`입력 ${inputIndex + 1}`} disabled={loading} />
                                                        <div className="problemadd-input-actions">
                                                            {testCase.inputs.length > 1 && (
                                                                <button type="button" onClick={() => handleRemoveCaseInput('test', testCase.id, inputIndex)} className="problemadd-icon-btn remove" disabled={loading}><MinusIcon /></button>
                                                            )}
                                                            {inputIndex === testCase.inputs.length - 1 && testCase.inputs.length < 10 && (
                                                                <button type="button" onClick={() => handleAddCaseInput('test', testCase.id)} className="problemadd-icon-btn add" disabled={loading}><PlusIcon /></button>
                                                            )}
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </td>
                                        <td className="problemadd-test-case-col-output"><textarea value={testCase.expected_output} onChange={(e) => handleChangeCaseOutput('test', testCase.id, e.target.value)} rows="1" disabled={loading}></textarea></td>
                                        <td className="problemadd-test-case-col-action"><button type="button" onClick={() => handleRemoveCase('test', testCase.id)} className="problemadd-remove-test-case-button" disabled={loading || testCases.length === 1}>삭제</button></td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    ) : (
                         <p className="problemadd-no-items-message">테스트케이스가 없습니다. '테스트케이스 추가' 버튼을 눌러 추가하세요.</p>
                    )}
                </div>

                {error && <p className="problemadd-error-message">{error}</p>}

                <div className="problemadd-form-buttons">
                    <button type="submit" className="problemadd-submit-button" disabled={loading}>
                        {loading ? '추가 중...' : '문제 추가'}
                    </button>
                    <button type="button" className="problemadd-cancel-button" onClick={() => navigate(classId ? `/admin/classes/${classId}/problems` : '/admin/problems')} disabled={loading}>
                        취소
                    </button>
                </div>
            </form>
        </div>
    );
};

export default ProblemAdd;