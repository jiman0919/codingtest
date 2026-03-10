import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getProblemBankDetail, importProblemFromBank } from '../Api/BankAPI';
import { getClassById } from '../Api/ClassAPI'; 
import './BankDetail.css';

const BankDetail = () => {
    const { classId, problemId } = useParams();
    const navigate = useNavigate();

    const [problem, setProblem] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [classLanguage, setClassLanguage] = useState('');

    useEffect(() => {
        const fetchProblemAndClass = async () => {
            if (!problemId || !classId) {
                setError("ID가 유효하지 않습니다.");
                setLoading(false);
                return;
            }
            try {
                const [problemData, classData] = await Promise.all([
                    getProblemBankDetail(problemId),
                    getClassById(classId)
                ]);
                setProblem(problemData);
                setClassLanguage(classData.language);
            } catch (err) {
                console.error("Failed to fetch data:", err);
                setError('데이터를 불러오는 데 실패했습니다.');
            } finally {
                setLoading(false);
            }
        };

        fetchProblemAndClass();
    }, [problemId, classId]);

    const handleImport = async () => {
        if (problem.language.toLowerCase() !== classLanguage.toLowerCase()) {
            alert(`이 문제는 '${problem.language}' 언어 문제입니다.\n현재 강좌는 '${classLanguage}' 언어만 등록할 수 있습니다.`);
            return;
        }

        if (window.confirm('이 문제를 현재 강좌로 가져오시겠습니까?')) {
            try {
                setLoading(true);
                await importProblemFromBank(classId, problemId);
                alert('문제를 성공적으로 가져왔습니다.');
                navigate(`/admin/classes/${classId}/problems`);
            } catch (err) {
                alert(`가져오기에 실패했습니다: ${err.response?.data?.detail || err.message}`);
                console.error("문제 가져오기 실패:", err);
                setLoading(false);
            }
        }
    };

    const handleGoBack = () => {
        navigate(-1);
    };

    if (loading) return <div className="bankdetail-loading-message">정보를 불러오는 중...</div>;
    if (error) return <div className="bankdetail-error-message">오류: {error}</div>;
    if (!problem) return <div className="bankdetail-no-data-message">문제 정보가 없습니다.</div>;
    
    const examples = problem.example_input != null ? [{ 
        input: problem.example_input, 
        expected_output: problem.example_output 
    }] : [];
    
    const { testcases = [] } = problem;

    return (
        <div className="bankdetail-container">
            <button onClick={handleGoBack} className="bankdetail-back-button">뒤로가기</button>

            <h2>{problem.title}</h2>
            <p className="bankdetail-problem-score">배점: {problem.score}점</p>

            <div className="bankdetail-info-box">
                <h3>문제 설명</h3>
                <p>{problem.description}</p>
            </div>

            {problem.language.toLowerCase() === 'python' && problem.function_name && (
                <div className="bankdetail-info-box">
                    <h3>함수 이름</h3>
                    <p>{problem.function_name}</p>
                </div>
            )}
            
            {problem.default_code && (
                <div className="bankdetail-info-box">
                    <h3>기본 코드</h3>
                    <pre className="bankdetail-code-block">{problem.default_code}</pre>
                </div>
            )}

            <div className="bankdetail-dynamic-section">
                <h3>예시</h3>
                {examples.length > 0 ? (
                    examples.map((example, index) => {
                        const inputs = String(example.input || '').trim().split(/\s+/).filter(i => i);
                        return (
                            <div key={index} className="bankdetail-example-table-container">
                                <h4>예시 {index + 1}</h4>
                                <table className="bankdetail-dynamic-table">
                                    <thead>
                                        <tr>
                                            {inputs.map((_, i) => (
                                                <th key={`ex-header-${i}`}>입력{i + 1}</th>
                                            ))}
                                            <th>예상 출력</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        <tr>
                                            {inputs.map((val, i) => (
                                                <td key={`ex-in-${i}`} className="bankdetail-detail-value">{val}</td>
                                            ))}
                                            <td className="bankdetail-detail-value">{example.expected_output}</td>
                                        </tr>
                                    </tbody>
                                </table>
                            </div>
                        )
                    })
                ) : <p>예시가 없습니다.</p>}
            </div>

            <div className="bankdetail-dynamic-section">
                <h3>테스트케이스</h3>
                {testcases.length > 0 ? (
                    testcases.map((tc, index) => {
                        const inputs = String(tc.input || '').trim().split(/\s+/).filter(i => i);
                        return (
                            <div key={index} className="bankdetail-example-table-container">
                                <h4>테스트케이스 {index + 1}</h4>
                                <table className="bankdetail-dynamic-table">
                                    <thead>
                                        <tr>
                                            {inputs.map((_, i) => (
                                                <th key={`tc-header-${i}`}>입력{i + 1}</th>
                                            ))}
                                            <th>예상 출력</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        <tr>
                                            {inputs.map((val, i) => (
                                                <td key={`tc-in-${i}`} className="bankdetail-detail-value">{val}</td>
                                            ))}
                                            <td className="bankdetail-detail-value">{tc.expected_output}</td>
                                        </tr>
                                    </tbody>
                                </table>
                            </div>
                        )
                    })
                ) : <p>테스트케이스가 없습니다.</p>}
            </div>

            <div className="bankdetail-form-buttons">
                <button onClick={handleImport} className="bankdetail-submit-button">가져오기</button>
            </div>
        </div>
    );
};

export default BankDetail;