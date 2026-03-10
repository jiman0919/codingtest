import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { getMyBankProblems, getOthersBankProblems, deleteBankItem } from '../Api/BankAPI';
import Header from '../Header/Header';
import './BankList.css';

const LANGUAGES = ['C', 'Java', 'Python'];
const SORT_OPTIONS = {
    NEWEST: '최신순',
    OLDEST: '오래된순',
};

// Accordion 컴포넌트를 BankList 밖으로 이동
const Accordion = ({ label, options, selectedOption, onOptionSelect, isOpen, setIsOpen }) => (
    <div className="banklist-accordion">
        <button className="banklist-accordion-header" onClick={() => setIsOpen(!isOpen)}>
            <span>{selectedOption || label}</span>
            <span className={`banklist-accordion-arrow ${isOpen ? 'open' : ''}`}>▼</span>
        </button>
        <div className={`banklist-accordion-panel ${isOpen ? 'open' : ''}`}>
            {options.map(option => (
                <button key={option.value} onClick={() => { onOptionSelect(option.value); setIsOpen(false); }}>
                    {option.label}
                </button>
            ))}
        </div>
    </div>
);

// ProblemItem 컴포넌트를 BankList 밖으로 이동
const ProblemItem = ({ problem, isMine, onNavigate, onDelete }) => {
    const formattedDate = problem.created_at.substring(0, 16).replace('T', ' ').replace(/-/g, '.');
    return (
        <div className="banklist-item" onClick={() => onNavigate(problem.id)}>
            <div className="banklist-info">
                <div className="banklist-title-link">{problem.title}</div>
                <div className="banklist-meta">
                    <span>작성자: {problem.author_name}</span>
                    <span>언어: {problem.language}</span>
                    <span>생성일: {formattedDate}</span>
                </div>
            </div>
            <div className="banklist-actions">
                {isMine && (
                    <button className="banklist-delete-btn" onClick={(e) => onDelete(e, problem.id, problem.title)}>
                        삭제
                    </button>
                )}
            </div>
        </div>
    );
};


const BankList = () => {
    const { classId } = useParams();
    const navigate = useNavigate();
    
    const [myOriginalProblems, setMyOriginalProblems] = useState([]);
    const [othersOriginalProblems, setOthersOriginalProblems] = useState([]);
    const [mySelectedLanguage, setMySelectedLanguage] = useState(null);
    const [mySortOrder, setMySortOrder] = useState(SORT_OPTIONS.NEWEST);
    const [isMyLangAccordionOpen, setIsMyLangAccordionOpen] = useState(false);
    const [isMySortAccordionOpen, setIsMySortAccordionOpen] = useState(false);
    const [othersSelectedLanguage, setOthersSelectedLanguage] = useState(null);
    const [othersSortOrder, setOthersSortOrder] = useState(SORT_OPTIONS.NEWEST);
    const [isOthersLangAccordionOpen, setIsOthersLangAccordionOpen] = useState(false);
    const [isOthersSortAccordionOpen, setIsOthersSortAccordionOpen] = useState(false);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const fetchProblems = useCallback(async () => {
        setLoading(true);
        try {
            const [myProblemsData, othersProblemsData] = await Promise.all([
                getMyBankProblems(),
                getOthersBankProblems()
            ]);
            setMyOriginalProblems(myProblemsData);
            setOthersOriginalProblems(othersProblemsData);
        } catch (err) {
            setError('문제 목록을 불러오는 데 실패했습니다.');
            console.error(err);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        if (classId) {
            fetchProblems();
        } else {
            setLoading(false);
            setMyOriginalProblems([]);
            setOthersOriginalProblems([]);
        }
    }, [classId, fetchProblems]);

    const myProcessedProblems = useMemo(() => {
        let problems = [...myOriginalProblems];
        if (mySelectedLanguage) {
            problems = problems.filter(p => p.language.toLowerCase() === mySelectedLanguage.toLowerCase());
        }
        if (mySortOrder === SORT_OPTIONS.OLDEST) {
            problems.sort((a, b) => new Date(a.created_at) - new Date(b.created_at));
        } else {
            problems.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
        }
        return problems;
    }, [myOriginalProblems, mySelectedLanguage, mySortOrder]);

    const othersProcessedProblems = useMemo(() => {
        let problems = [...othersOriginalProblems];
        if (othersSelectedLanguage) {
            problems = problems.filter(p => p.language.toLowerCase() === othersSelectedLanguage.toLowerCase());
        }
        if (othersSortOrder === SORT_OPTIONS.OLDEST) {
            problems.sort((a, b) => new Date(a.created_at) - new Date(b.created_at));
        } else {
            problems.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
        }
        return problems;
    }, [othersOriginalProblems, othersSelectedLanguage, othersSortOrder]);


    const handleDelete = async (e, problemId, problemTitle) => {
        e.stopPropagation(); 
        if (window.confirm(`문제 "${problemTitle}"을(를) 정말로 삭제하시겠습니까?`)) {
            try {
                await deleteBankItem(problemId);
                alert('문제가 성공적으로 삭제되었습니다.');
                fetchProblems();
            } catch (err) {
                alert(`삭제에 실패했습니다: ${err.message}`);
            }
        }
    };

    const handleNavigateToDetail = (problemId) => {
        navigate(`/admin/classes/${classId}/bank/detail/${problemId}`);
    };

    if (loading) return <div className="banklist-loading-message">문제 목록을 불러오는 중...</div>;
    if (error) return <div className="banklist-error-message">오류: {error}</div>;

    return (
        <>
            <Header />
            <div className="banklist-container">
                <div className="banklist-header">
                    <h2>내 문제 목록</h2>
                    <div className="banklist-header-controls">
                        <Accordion
                            label="전체 언어"
                            options={[{value: null, label: '전체 언어'}, ...LANGUAGES.map(l => ({value: l, label: l}))]}
                            selectedOption={mySelectedLanguage}
                            onOptionSelect={setMySelectedLanguage}
                            isOpen={isMyLangAccordionOpen}
                            setIsOpen={setIsMyLangAccordionOpen}
                        />
                        <Accordion
                            label="최신순"
                            options={Object.values(SORT_OPTIONS).map(s => ({value: s, label: s}))}
                            selectedOption={mySortOrder}
                            onOptionSelect={setMySortOrder}
                            isOpen={isMySortAccordionOpen}
                            setIsOpen={setIsMySortAccordionOpen}
                        />
                    </div>
                </div>
                <div className="banklist-grid">
                    {myProcessedProblems.length === 0 ? (
                        <div className="banklist-no-data-message">문제가 없습니다.</div>
                    ) : (
                        myProcessedProblems.map((problem) => (
                            <ProblemItem 
                                key={problem.id} 
                                problem={problem} 
                                isMine={true}
                                onNavigate={handleNavigateToDetail}
                                onDelete={handleDelete}
                            />
                        ))
                    )}
                </div>
                
                <div className="banklist-header" style={{ marginTop: '40px' }}>
                    <h2>다른사람 문제 목록</h2>
                    <div className="banklist-header-controls">
                        <Accordion
                            label="전체 언어"
                            options={[{value: null, label: '전체 언어'}, ...LANGUAGES.map(l => ({value: l, label: l}))]}
                            selectedOption={othersSelectedLanguage}
                            onOptionSelect={setOthersSelectedLanguage}
                            isOpen={isOthersLangAccordionOpen}
                            setIsOpen={setIsOthersLangAccordionOpen}
                        />
                         <Accordion
                            label="최신순"
                            options={Object.values(SORT_OPTIONS).map(s => ({value: s, label: s}))}
                            selectedOption={othersSortOrder}
                            onOptionSelect={setOthersSortOrder}
                            isOpen={isOthersSortAccordionOpen}
                            setIsOpen={setIsOthersSortAccordionOpen}
                        />
                    </div>
                </div>
                <div className="banklist-grid">
                    {othersProcessedProblems.length === 0 ? (
                        <div className="banklist-no-data-message">문제가 없습니다.</div>
                    ) : (
                        othersProcessedProblems.map((problem) => (
                            <ProblemItem 
                                key={problem.id} 
                                problem={problem} 
                                isMine={false}
                                onNavigate={handleNavigateToDetail}
                                onDelete={handleDelete}
                            />
                        ))
                    )}
                </div>
            </div>
        </>
    );
};

export default BankList;