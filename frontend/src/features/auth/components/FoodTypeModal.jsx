import { useRef, useEffect } from 'react';

/**
 * FoodTypeModal displays a modal dialog for selecting food types/cuisines.
 * It shows a list of available food types with checkboxes, allowing users to select multiple options.
 * The component handles loading states, errors, and provides a "Done" button to close the modal.
 * 
 * @param {Object} props - Component props
 * @param {boolean} props.isOpen - Whether the modal is currently open
 * @param {Function} props.onClose - Callback function to close the modal
 * @param {Array} props.availableFoodTypes - Array of food type objects with id and name properties
 * @param {Array<number>} props.selectedFoodTypeIds - Array of currently selected food type IDs
 * @param {Function} props.handleFoodTypeChange - Callback function when a food type selection changes
 * @param {boolean} props.isLoading - Whether food types are currently loading
 * @param {string|null} props.error - Error message if food types failed to load
 * @param {string} [props.modalId="food_type_modal"] - ID for the modal element
 */
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
    <dialog
      id={modalId}
      className="modal"
      ref={modalRef}
      role="dialog"
      aria-modal="true"
      aria-labelledby="food_type_modal_title"
    >
      <div className="modal-box">
        <h3 className="font-bold text-lg mb-4" id="food_type_modal_title">Select Food Types</h3>
        <button
          type="button"
          className="btn btn-sm btn-circle btn-ghost absolute right-2 top-2"
          onClick={onClose}
          aria-label="Close"
        >
          ✕
        </button>

        <ul className="menu p-0 bg-base-100 rounded-box w-full max-h-60 overflow-y-auto mb-4" aria-live="polite">
          {isLoading ? (
            <li className="menu-title p-4"><span>Loading food types...</span></li>
          ) : error ? (
            <li className="menu-title p-4 text-error"><span>Failed to load types.</span></li>
          ) : availableFoodTypes?.length > 0 ? (
            availableFoodTypes.map(type => (
              <li key={type.id}>
                <label className="label cursor-pointer justify-start block">
                  <input
                    type="checkbox"
                    value={type.id}
                    checked={selectedFoodTypeIds.includes(type.id)}
                    onChange={handleFoodTypeChange}
                    className="checkbox checkbox-primary mr-4"
                    aria-label={`Select ${type.name}`}
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