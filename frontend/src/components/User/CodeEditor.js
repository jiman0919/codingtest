import React, { useState, useEffect } from 'react';
import Editor from '@monaco-editor/react';
import './CodeEditor.css';
import { useParams } from 'react-router-dom';
// [수정] getSubmissionStatusForCourse API 함수를 import 합니다.
import { getProblemDetail, submitCode, submitAndEvaluate, requestSubmissionReset, getSubmissionStatusForCourse } from '../../services/api';

const languages = [
    { id: 'python', name: 'Python', judge0Id: 71 },
    { id: 'java', name: 'Java', judge0Id: 62 },
    { id: 'c', name: 'C', judge0Id: 50 },
];

function CodeEditor({ onSubmit, onCodeSubmit }) {
    const { classId, problemId } = useParams(); // [수정] classId 추가
    const [code, setCode] = useState('');
    const [language, setLanguage] = useState('');
    const [runLoading, setRunLoading] = useState(false);
    const [submitLoading, setSubmitLoading] = useState(false);
    const [hasSubmitted, setHasSubmitted] = useState(false);

    // ▼▼▼ [수정] useEffect 로직 변경 ▼▼▼
    useEffect(() => {
        if (problemId && classId) {
            const fetchProblemData = async () => {
                try {
                    // 1. 문제 상세 정보를 가져옵니다.
                    const problemDetail = await getProblemDetail(problemId);
                    setCode(problemDetail?.default_code || '');
                    setLanguage(problemDetail?.language || 'python');

                    // 2. 이어서 모든 문제의 제출 상태를 가져옵니다.
                    const submissionStatuses = await getSubmissionStatusForCourse(classId);
                    
                    // 3. 현재 문제의 제출 상태를 찾아 UI에 반영합니다.
                    const currentStatus = submissionStatuses.find(status => status.problem_id.toString() === problemId);
                    setHasSubmitted(currentStatus?.is_submitted || false);

                } catch (error) {
                    console.error('Error fetching problem data:', error);
                    setCode('// 문제 정보를 불러오는 데 실패했습니다.');
                    setLanguage('plaintext');
                }
            };
            fetchProblemData();
        }
    }, [classId, problemId]); // problemId가 바뀔 때마다 이 useEffect는 다시 실행됩니다.
    // ▲▲▲ [수정] 여기까지 ▲▲▲


    const handleRunClick = async () => {
        setRunLoading(true);
        try {
            const selectedLanguage = languages.find(l => l.id === language);
            if (!selectedLanguage) throw new Error("지원하지 않는 언어입니다.");
            const response = await submitCode({
                problem_id: problemId,
                source_code: code,
                language_id: selectedLanguage.judge0Id,
                stdin: ""
            });
            onSubmit({ ...response, isSubmission: false });
        } catch (error) {
            onSubmit({ status: { description: '실행 실패' }, stderr: error.message, isSubmission: false });
        } finally {
            setRunLoading(false);
        }
    };

    const handleSubmitClick = async () => {
        if (window.confirm("제출하시겠습니까?")) {
            setSubmitLoading(true);
            try {
                const selectedLanguage = languages.find(l => l.id === language);
                if (!selectedLanguage) {
                    throw new Error("지원하지 않는 언어입니다.");
                }
                const response = await submitAndEvaluate({
                    user_id: 1, // 실제 로그인 ID로 변경 필요
                    problem_id: problemId,
                    source_code: code,
                    language_id: selectedLanguage.judge0Id
                });

                if (response && response.is_submitted) {
                    alert('제출에 성공했습니다!');
                    setHasSubmitted(true);
                    onCodeSubmit({ submissionStatus: 'success' });
                } else if (response && response.detail === "이미 이 문제를 제출했습니다.") {
                    alert(response.detail);
                    setHasSubmitted(true);
                    onCodeSubmit({ submissionStatus: 'already_submitted', message: response.detail });
                } else {
                    onCodeSubmit({ ...response, isSubmission: true });
                }

            } catch (error) {
                onCodeSubmit({ isSubmission: true, testcase_results: [], error: `제출 실패: ${error.message}` });
            } finally {
                setSubmitLoading(false);
            }
        }
    };
    
    const handleResetClick = async () => {
        if (window.confirm("제출 기록 초기화를 요청하시겠습니까? 교수의 승인이 필요합니다.")) {
            try {
                const response = await requestSubmissionReset(problemId);
                alert(response.message || '초기화 요청이 성공적으로 전송되었습니다.');
            } catch (error) {
                alert(error.message);
            }
        }
    };

    const currentLanguageName = languages.find(l => l.id === language)?.name || language;

    return (
        <div className="codeeditor-code-editor">
            <div className="codeeditor-code-editor__toolbar">
                <div className="codeeditor-code-editor__language-display">
                    <span style={{ color: 'white' }}>{currentLanguageName}</span>
                </div>
                <div className="codeeditor-code-editor__actions">
                    <button
                        className="codeeditor-code-editor__button codeeditor-code-editor__button--run"
                        onClick={handleRunClick}
                        disabled={!language || runLoading || submitLoading}
                    >
                        {runLoading ? '처리 중...' : '코드 실행'}
                    </button>

                    {hasSubmitted ? (
                        <button
                            className="codeeditor-code-editor__button codeeditor-code-editor__button--reset"
                            onClick={handleResetClick}
                            disabled={runLoading || submitLoading}
                        >
                            제출 기록 초기화 요청
                        </button>
                    ) : (
                        <button
                            className="codeeditor-code-editor__button codeeditor-code-editor__button--submit"
                            onClick={handleSubmitClick}
                            disabled={!language || runLoading || submitLoading}
                        >
                            {submitLoading ? '처리 중...' : '제출'}
                        </button>
                    )}
                </div>
            </div>
            <div className="codeeditor-code-editor__editor-area">
                <Editor
                    height="100%"
                    language={language}
                    value={code}
                    onChange={setCode}
                    theme="vs-dark"
                    options={{
                        minimap: {
                            enabled: false
                        }
                    }}
                />
            </div>
        </div>
    );
}
export default CodeEditor;