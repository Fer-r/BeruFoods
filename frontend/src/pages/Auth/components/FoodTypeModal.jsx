import { useRef, useEffect } from 'react';

const FoodTypeModal = ({
  isOpen,
  onClose,
  availableFoodTypes,
  selectedFoodTypeIds,
  handleFoodTypeChange,
  isLoading,
  error,
  modalId = "food_type_modal"
}) => {
  const modalRef = useRef(null);

  useEffect(() => {
    const modal = modalRef.current;
    if (modal) {
      if (isOpen) {
        modal.showModal();
      } else {
        modal.close();
      }
    }
  }, [isOpen]);

  return (
    <dialog id={modalId} className="modal" ref={modalRef}>
      <div className="modal-box">
        <h3 className="font-bold text-lg mb-4">Select Food Types</h3>
        <button
          type="button"
          className="btn btn-sm btn-circle btn-ghost absolute right-2 top-2"
          onClick={onClose}
        >
          ✕
        </button>

        <ul className="menu p-0 bg-base-100 rounded-box w-full max-h-60 overflow-y-auto mb-4">
          {isLoading ? (
            <li className="menu-title p-4"><span>Loading food types...</span></li>
          ) : error ? (
            <li className="menu-title p-4 text-error"><span>Failed to load types.</span></li>
          ) : availableFoodTypes.length > 0 ? (
            availableFoodTypes.map(type => (
              <li key={type.id}>
                <label className="label cursor-pointer justify-start block">
                  <input
                    type="checkbox"
                    value={type.id}
                    checked={selectedFoodTypeIds.includes(type.id)}
                    onChange={handleFoodTypeChange}
                    className="checkbox checkbox-primary mr-4"
                  />
                  <span className="label-text whitespace-normal">{type.name}</span>
                </label>
              </li>
            ))
          ) : (
            <li className="menu-title p-4"><span>No food types available.</span></li>
          )}
        </ul>

        <div className="modal-action">
          <button type="button" className="btn" onClick={onClose}>Done</button>
        </div>
      </div>
      <div className="modal-backdrop" onClick={onClose}></div>
    </dialog>
  );
};

export default FoodTypeModal; 